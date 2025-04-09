const { imgUpload, imgUrl } = require('../uploads');
const { tryCatch, dbQuery } = require('../utils');

exports.main = tryCatch(async(req, res, next) => {
    let [ { data } ] = await dbQuery(
        `
            SELECT JSON_OBJECTAGG(
                boardType,
                json_data
            ) AS data
            FROM (
                SELECT boardType,
                    JSON_ARRAYAGG(
                        JSON_MERGE_PATCH(
                            JSON_OBJECT(
                                'id', id,
                                'title', title,
                                'created', created,
                                'author', userId
                            ),
                            CASE 
                                WHEN boardType = 'stock' AND image IS NOT NULL THEN 
                                    JSON_OBJECT('image', CONCAT('http://${process.env.HOST}:${process.env.PORT}', image))
                                ELSE 
                                    JSON_OBJECT()  
                            END,
                            CASE 
                                WHEN boardType IN ('vip', 'clinic') THEN JSON_OBJECT('secret', CASE 
                                                                                                    WHEN secret = 1 THEN 'y' 
                                                                                                    WHEN secret = 0 THEN 'n' 
                                                                                                    ELSE NULL 
                                                                                                END) 
                                ELSE JSON_OBJECT()
                            END
                        )
                    ) AS json_data
                FROM (
                    SELECT b.id, b.boardType, b.title, 
                        DATE_FORMAT(b.created, '%Y.%m.%d') AS created,
                        b.image, u.userId, b.secret
                    FROM (
                        SELECT *, ROW_NUMBER() OVER (
                                    PARTITION BY boardType 
                                    ORDER BY created DESC
                                ) AS row_num
                        FROM boards
                        WHERE boardType IN ('recommendation', 'revenue', 'stock', 'vip', 'clinic', 'notice')
                    ) AS b
                    LEFT JOIN users u ON b.author = u.id
                    WHERE 
                        (b.boardType = 'stock' AND row_num <= 2)  
                        OR (b.boardType != 'stock' AND row_num <= 5)
                ) AS filtered
                GROUP BY boardType
            ) AS grouped;
        `
    )
    
    res.status(200).json({result: true, data})
})

exports.create = tryCatch(async(req, res, next) => {
    await dbQuery(
        `
            INSERT INTO ${req.DBName}
            (${req.keys.join(',')})
            VALUES (${req.keys.map(()=>'?').join(',')})
        `,
        req.values
    )

    // 이미지가 있는 경우 - 이미지 파일 저장
    if(req.file){
        imgUpload(req, res, next)
    }
    
    res.status(200).json({result: true})
})

exports.read = tryCatch(async(req, res, next) => {
    const { boardType, page = 1, search, type } = req.query;
    // console.log(boardType);
    // console.log(req.DBName);
    
    // boardType
    // recommendation, revenue, stock, vip, clinic, notice
    const limit = 10;
    let fields = ['id', 'title', `new`, 'created'/* , `CASE WHEN new = 1 THEN 'y' ELSE 'n' END AS new` */]
    const isTypeField = ['recommendation', 'revenue']
    const isImageField = ['stock']
    const isSecretField = ['vip', 'clinic'];
    const isAuthorField = ['vip', 'clinic'];
    const isBooleanField = ['new', 'secret'];
    let joinConditions = ''
    let conditions = [`boardType = ?`];
    let values = [boardType];


    // 출력 필드 추가
    if(req.fields){
        fields.push(...req.fields)
    }
    

    if(isTypeField.includes(boardType)){
        fields.push('type')
    }
    
    if(isImageField.includes(boardType)){
        fields.push('image')
    }

    if(isSecretField.includes(boardType)){
        fields.push(`secret`)
    }


    // fields 명시, boolean AS 'y' or 'n'
    fields = fields.map((name) => isBooleanField.includes(name) ? `CASE WHEN ${req.DBName}.${name} = 1 THEN 'y' ELSE 'n' END AS ${name}` : `${req.DBName}.${name}`);
    
    
    // 작성자 추가
    if(isAuthorField.includes(boardType)){
        fields.push(`users.userId AS author`)
        joinConditions = 'LEFT JOIN users ON boards.author = users.id'
    }


    // 페이징, 검색
    if (search) {
        conditions.push(`title LIKE ?`);
        values.push(`%${search}%`);
    }

    if (type) {
        conditions.push(`type = ?`);
        values.push(type);
    }


    const [{ totalCount }] = await dbQuery(
        `
            SELECT COUNT(*) AS totalCount
            FROM ${req.DBName}
            WHERE ${conditions.join(' AND ')};
        `,
        values
    )
    
    let list = await dbQuery(
        `
            SELECT ${fields.join(',')}
            FROM ${req.DBName}
            ${joinConditions}
            WHERE ${conditions.join(' AND ')}
            ORDER BY boards.created DESC
            LIMIT ${limit} OFFSET ${(limit * ((page || 1) - 1))};
        `,
        values
    )
    
    list = list.map((data, idx) => ({
        ...data,
        numb: totalCount - (page - 1) * limit - idx,
        created: data.created.toISOString().split('T')[0].replaceAll('-', '.'),
        // new: data.new === 'y'
        // secret: data.secret === 'y'
    }))

    const info = {
        totalCount,
        limit,
        page: Number(page),
        totalPage: Math.ceil(totalCount / limit),
    }

    // 굳이?
    // if(list.some((obj)=> Object.keys(obj).some((key) => key ==='image'))){
    //     list = imgUrl(list)
    // }

    list = imgUrl(list) 

    res.status(200).json({result: true, info, list})
})


exports.detail = tryCatch(async(req, res, next) => {
    const { boardId, boardType } = req.query;
    let fields = ['id', 'title', 'content', 'content', 'created'];
    const isPrevNext = ['recommendation', 'revenue', 'stock'];
    const isSecretField = ['vip', 'clinic'];
    const isBooleanField = ['new', 'secret'];
    let joinConditions = ''
    let values = [boardId, boardType]


    if(isSecretField.includes(boardType)){
        fields.push(`secret`)
    }


    // fields 명시, boolean AS 'y' or 'n'
    fields = fields.map((name) => isBooleanField.includes(name) ? `CASE WHEN ${req.DBName}.${name} = 1 THEN 'y' ELSE 'n' END AS ${name}` : `${req.DBName}.${name}`);
    

    // 작성자 추가
    fields.push(`users.userId AS author`)
    joinConditions = 'LEFT JOIN users ON boards.author = users.id'

    let sendData = {}
    const [data] = await dbQuery(
        `
            WITH params AS (
                SELECT ? AS boardId, ? AS boardType
            )
            SELECT ${fields.join(',')},
                (SELECT id FROM boards WHERE id < p.boardId AND boardType = p.boardType ORDER BY id DESC LIMIT 1) AS prev,
                (SELECT id FROM boards WHERE id > p.boardId AND boardType = p.boardType ORDER BY id ASC LIMIT 1) AS next
            FROM ${req.DBName}
            ${joinConditions}
            , params p  
            WHERE boards.id = p.boardId AND boards.boardType = p.boardType
            ORDER BY boards.created DESC
        `,
        values
    )

    if(!data){
        console.log(data);
        return res.status(200).json({result: false})
    }

    sendData = data ? { data: { ...data } } : { isData: null };
    
    // 이전/다음 글 쿼리
    if(isPrevNext.includes(boardType) && (data.prev || data.next)){
        let post = {}
        const [prev, next] = await dbQuery(
            `
                SELECT 
                    boards.id, 
                    boards.title
                FROM boards AS boards
                WHERE boards.id IN (?, ?);
            `,
            [data.prev, data.next]
        );
        post.prev = prev;
        post.next = next;
        sendData = {...sendData, post}
    }

    
    if(isSecretField.includes(boardType) && data){
        // access 토큰이 만료 되었을 때 ( refesh 토근 있음 ) access 토큰 새로 받아 올 수 있나?
        const token = req.cookies.userAccessToken;
        const isUpdateUser = token && data.author === JSON.parse(atob(token.split(".")[1])).userId
        const isSecretUser = isUpdateUser || data.secret === 'n';
        sendData = { ...sendData, isUpdateUser, isSecretUser };
    }

    Object.keys(data).filter((key) => key !== 'prev' || key !== 'next');

    data.created = data.created.toISOString().replace("T", " ").slice(0, 16).replace(/-/g, ".")
    // console.log(sendData);
    
    res.status(200).json({result: true, ...sendData})
})

exports.update = tryCatch(async(req, res, next) => {
    console.log(req.keys);
    console.log(req.values);
    console.log(req.DBName);
    
    await dbQuery(
        `
            UPDATE ${req.DBName}
            SET ${req.keys.map(key => `${key} = ?`).join(', ')}
            WHERE id = ?
        `,
        [...req.values]
    );
    
    res.status(200).json({result: true})
})

exports.remove = tryCatch(async(req, res, next) => {
    await dbQuery(`DELETE FROM boards WHERE id = ?`, req.values);

    res.status(200).json({result: true})
})
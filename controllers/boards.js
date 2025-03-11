const { imgUpload, imgUrl } = require('../uploads');
const { tryCatch, dbQuery } = require('../utils');

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
    // boardType
    // recommendation, revenue, stock, vip, clinic, notice
    const limit = 10;
    let fields = ['id', 'title', `new`, 'created'/* , `CASE WHEN new = 1 THEN 'y' ELSE 'n' END AS new` */]
    const isTypeField = ['recommendation', 'revenue']
    const isImageField = ['stock']
    const isSecretField = ['vip', 'clinic'];
    const isBooleanField = ['new', 'secret'];
    const isAuthorField = ['vip', 'clinic'];
    let joinConditions = ''
    let conditions = [`boardType = ?`];
    let values = [boardType];


    // 출력 필드 추가
    if(isTypeField.includes(boardType)){
        fields.push('type')
    }
    
    if(isImageField.includes(boardType)){
        fields.push('image')
    }

    if(isSecretField.includes(boardType)){
        fields.push(`secret`)
        fields.push(`password`)
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

exports.isIdentity = tryCatch(async(req, res, next) => {
    
})

exports.detail = tryCatch(async(req, res, next) => {
    const { boardId, boardType } = req.query;
    let fields = ['id', 'title', 'content', 'content', 'created'];
    const isBooleanField = ['new', 'secret'];
    const isPrevNext = ['recommendation', 'revenue', 'stock'];
    let joinConditions = ''
    let values = [boardId, boardType]


    // fields 명시, boolean AS 'y' or 'n'
    fields = fields.map((name) => isBooleanField.includes(name) ? `CASE WHEN ${req.DBName}.${name} = 1 THEN 'y' ELSE 'n' END AS ${name}` : `${req.DBName}.${name}`);
    

    // 작성자 추가
    fields.push(`users.userId AS author`)
    joinConditions = 'LEFT JOIN users ON boards.author = users.id'


    console.log('values', values);
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

    // 이전/다음 글 쿼리
    let post;
    if(isPrevNext.includes(boardType) && data.prev || data.next){
        post = {}
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
    }

    Object.keys(data).filter((key) => key !== 'prev' || key !== 'next');

    data.created = data.created.toISOString().replace("T", " ").slice(0, 16).replace(/-/g, ".")
 
    res.status(200).json({result: true, data, post})
})
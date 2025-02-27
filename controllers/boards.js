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
    const limit = 10;
    let fields = ['id', 'created', 'title', `new`/* , `CASE WHEN new = 1 THEN 'y' ELSE 'n' END AS new` */]
    const isTypeField = ['recommendation', 'revenue']
    const isImageField = ['stock', 'revenue']
    const isSecretField = ['vip', 'clinic', 'notice'];
    const isBooleanField = ['new', 'secret'];
    const isAuthorField = ['vip', 'clinic', 'notice'];
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
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
    const fields = ['id', 'created', 'title', `CASE WHEN new = 1 THEN 'y' ELSE 'n' END AS new`]

    if(boardType === 'recommendation' || boardType === 'revenue'){
        fields.push('type')
    }
    
    if(boardType === 'stock'){
        fields.push('image')
    }

    let conditions = [`boardType = ?`];
    let values = [boardType];

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
            WHERE ${conditions.join(' AND ')}
            ORDER BY created DESC
            LIMIT ${limit} OFFSET ${(limit * ((page || 1) - 1))};
        `,
        values
    )

    list = list.map((data, idx) => ({
        ...data,
        numb: totalCount - (page - 1) * limit - idx,
        created: data.created.toISOString().split('T')[0].replaceAll('-', '.'),
        // new: data.new === 'y'
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
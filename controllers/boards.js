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

    res.status(200).json({result: true})
})

exports.boards = tryCatch(async(req, res, next) => {
    const { boardType, page = 1, search, type } = req.query;
    const limit = 2;
    const fields = ['id', 'created', 'title', `CASE WHEN new = 1 THEN 'y' ELSE 'n' END AS new`]

    if(boardType === 'recommendation'){
        fields.push('type')
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
        new: data.new === 'y'
    }))

    const info = {
        totalCount,
        limit,
        page: Number(page),
        totalPage: Math.ceil(totalCount / limit),
    }

    res.status(200).json({result: true, info, list})
    
})
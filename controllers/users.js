const { tryCatch, dbQuery, fieldsDataChange } = require("../utils");

exports.read = tryCatch(async(req, res, next) => {
    const { query, DBName } = req;
    const { page = 1, search } = query;
    const limit = 10;
    const fields = ['id', 'userId', 'nickname', 'mobile', 'type', 'lastLogin', 'created']

    const [{ totalCount }] = await dbQuery(
        `
            SELECT COUNT(*) AS totalCount
            FROM ${DBName}
        `
    )

    const list = await dbQuery(
        `
            SELECT ${fieldsDataChange(DBName, fields, true)}
            FROM ${DBName}
            LIMIT ${limit} OFFSET ${(limit * ((page || 1) - 1))};
        `
    )

    const info = {
        totalCount,
        limit,
        page: Number(page),
        totalPage: Math.ceil(totalCount / limit),
    }
    
    res.status(200).json({result: true, info, list})
    
})

exports.detail = tryCatch(async(req, res, next) => {
    const { query, DBName } = req;
    const { id } = query;
    const fields = ['id', 'userId', 'nickname', 'mobile', 'type', 'memo', 'lastLogin', 'created']

    const [ data ]  = await dbQuery(
        `
            SELECT ${fieldsDataChange(DBName, fields)}
            FROM ${DBName}
            WHERE id = ?
        `,
        id
    )

    res.status(200).json({result: true, state: !!data, data})
})

exports.update = tryCatch(async(req, res, next) => {
    const { DBName, id, keys, values } = req;

    await dbQuery(
        `
            UPDATE ${DBName}
            SET ${keys.map(key => `${key} = ?`).join(', ')}
            WHERE id = ?
        `,
        [...values, id]
    );

    res.status(200).json({result: true, state: true, message: '수정되었습니다.'})
})
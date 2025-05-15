const { tryCatch, dbQuery, fieldsDataChange } = require("../utils");

exports.read = tryCatch(async(req, res, next) => {
    const { query, DBName } = req;
    const { page = 1, search } = query;
    const limit = 10;
    const fields = ['id', 'userId', 'nickname', 'mobile', 'type', 'listLogin', 'created']

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
const { tryCatch, dbQuery } = require("../utils");


exports.info = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    let { id } = body;
    const token = req.cookies.userAccessToken

    id = id || token && JSON.parse(atob(token.split(".")[1])).id
    
    if(!id){
        return res.status(200).json({ result: true, state: false });
    }

    const [ data ] = await dbQuery(
        `
            SELECT userId, nickname, mobile
            FROM ${DBName}
            WHERE id = ?
        `,
        id
    )
    
    return res.status(200).json({ result: true, state: true, data });
})
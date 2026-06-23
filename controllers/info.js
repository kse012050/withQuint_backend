const { tryCatch, dbQuery } = require("../utils");
const { buildInfoUpdateFields } = require('./infoUpdateFields');

const getTokenId = (token) => {
    if(!token) {
        return null;
    }

    try {
        return JSON.parse(atob(token.split(".")[1])).id;
    } catch (error) {
        return null;
    }
}


exports.info = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    let { id } = body;
    const token = req.cookies.userAccessToken

    id = id || getTokenId(token)
    
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

exports.update = tryCatch(async(req, res, next) => {
    const { DBName, body, isAdmin } = req;
    const token = req.cookies[`${isAdmin ? 'admin' : 'user'}AccessToken`] || req.cookies.userAccessToken;
    const id = getTokenId(token);

    if(!id){
        return res.status(200).json({ result: true, state: false, message: '로그인이 필요합니다.' });
    }

    const { keys, values } = await buildInfoUpdateFields(body);

    if(!keys.length){
        return res.status(200).json({ result: true, state: false, message: '변경할 값이 없습니다.' });
    }

    await dbQuery(
        `
            UPDATE ${DBName}
            SET ${keys.map(key => `${key} = ?`).join(', ')}
            WHERE id = ?
        `,
        [...values, id]
    );

    return res.status(200).json({ result: true, state: true, message: '수정되었습니다.' });
})

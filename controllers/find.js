const bcrypt = require('bcrypt');
const { tryCatch, dbQuery } = require('../utils');

exports.isId = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    const { mobile } = body;
    console.log(DBName);
    

    // const [{ isMobile }] = await dbQuery(
    //     `
    //         SELECT IF(
    //             EXISTS(SELECT 1 FROM ${DBName} WHERE mobile = ?), 
    //             TRUE, 
    //             FALSE
    //         ) AS isMobile;
    //     `,
    //     mobile
    // )
    
    // req.isMobile = !!isMobile;
    // next();
})

exports.isMobile = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    const { mobile } = body;

    if(!mobile) {
        return res.status(200).json({result: true, state: false, message: `mobile 값이 없습니다.`});
    }

    const [{ isMobile }] = await dbQuery(
        `
            SELECT IF(
                EXISTS(SELECT 1 FROM ${DBName} WHERE mobile = ?), 
                TRUE, 
                FALSE
            ) AS isMobile;
        `,
        mobile
    )
    
    req.isMobile = !!isMobile;
    next();
})

exports.findId = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    const { mobile } = body;

    const [data] = await dbQuery(
        `
            SELECT userId
            FROM ${DBName}
            WHERE mobile = ?;
        `,
        mobile
    )

    if(data){
        data.userId = data.userId.slice(0, data.userId.length - 2) + '**';
    }

    return res.status(200).json({result: true, state: !!data, data, message: data ? `본인 확인이 완료되었습니다.` : `가입된 정보가 없습니다.`});
})


exports.findPW = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    const { userId, mobile } = body;

    const [{ isExist }] = await dbQuery(
        `
            SELECT EXISTS (
                SELECT 1
                FROM ${DBName}
                WHERE mobile = ? AND userId = ?
            ) AS isExist
        `,
        [mobile, userId]
    )
    
    return res.status(200).json({result: true, state: !!isExist, data: {userId}, message: isExist ? `본인 확인이 완료되었습니다.` : `입력한 정보를 확인해주세요.`});
})

exports.pwChange = tryCatch(async(req, res, next) => {
    const { DBName, body } = req;
    let { userId, password } = body;

    password = await bcrypt.hash(password, 12)
    
    const data = await dbQuery(
        `
            UPDATE ${DBName}
            SET password = ?
            WHERE userId = ?;
        `,
        [password, userId]
    )

    let message = '비밀번호가 변경되었습니다.'
    if (data.affectedRows === 0) {
        message = '아이디가 없습니다.'
    } else if (data.changedRows === 0) {
        message = '이전 비밀번호와 동일합니다.'
    }
    return res.status(200).json({result: true, state: data.affectedRows > 0 && data.changedRows > 0, message });
    
})
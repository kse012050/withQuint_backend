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

    if(!mobile) {
        return res.status(200).json({result: true, state: false, message: `mobile 값이 없습니다.`});
    }

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

    return res.status(200).json({result: true, state: !!data, data});
    
})
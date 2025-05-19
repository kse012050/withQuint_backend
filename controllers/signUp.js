const bcrypt = require('bcrypt');
const { tryCatch, dbQuery } = require('../utils');
const { CoolsmsMessageService } = require('coolsms-node-sdk');
const redisClient = require('../utils/redisClient');
const coolsms = require("coolsms-node-sdk").default;


exports.signUp = tryCatch(async(req, res) => {
    const values = await Promise.all(
        Object.entries(req.body).map(async ([key, value]) => key === 'password' ? await bcrypt.hash(value, 12) : value)
    );

    await dbQuery(
        `
            INSERT INTO ${req.DBName} 
            (${req.fields.join(',')}, created)
            VALUES (${req.fields.map(()=>'?').join(',')}, NOW())
        `,
        values
    );

    res.status(200).json({result: true})
})

exports.check = tryCatch(async(req, res) => {
    const { type, value } = req.body;
    const name = type === 'userId' && '아이디' ||
                type === 'nickname' && '닉네임'
    
    if(!type || !value) {
        const errValues = ['type', 'value'].filter((key) => !req.body[key]);
        return res.status(400).json({result: false, error: `${errValues.join(', ')} 값이 없습니다.`});
    }
    

    const result = await dbQuery(
        `
            SELECT ${type}
            FROM ${req.DBName}
            WHERE ${type} = ?;
        `,
        value
    );

    const state = !result.length

    res.status(200).json({result: true, state: state,  message: `사용할 수 ${state ? '있는' : '없는'} ${name} 입니다` });
    
})

exports.isMobileNum = tryCatch(async(req, res, next) => {
    const { originalUrl, DBName, body } = req;
    const { mobile } = body;

    const [{ isMobileNum }] = await dbQuery(
        `
            SELECT IF(
                EXISTS(SELECT 1 FROM ${DBName} WHERE mobile = ?), 
                TRUE, 
                FALSE
            ) AS isMobileNum;
        `,
        mobile
    )
    console.log(originalUrl.includes('signUp'));

    if(originalUrl.includes('signUp') && isMobileNum){
        return res.status(200).json({result: true, state: false, message: `이미 가입된 번호입니다.`});
    }

    // if(path === '/mobileCheck' && !isMobileNum){
    //     return res.status(200).json({result: true, state: false, message: `가입된 번호가 없습니다.`});
    // }
    
    
    next();
})





exports.mobileAuthSend = tryCatch(async(req, res) => {
    const { mobile } = req.body;
    
    const messageService = new coolsms(process.env.MOBILE_API_KEY, process.env.MOBILE_API_SECRET);

    const mobileAuthSend = Math.floor(Math.random() * 1000000);
    console.log(mobileAuthSend);
    
    // const response = await messageService.sendOne({
    //     to: mobile,
    //     from: '01092931656',
    //     text: "김성은 - 위드퀸트 인증번호\n" +
    //             `[${mobileAuthSend}] 를 입력해주세요.`,
    // });
    
    // await redisClient.set(`verify:${mobile}`, mobileAuthSend, { EX: 180 })

    res.status(200).json({result: true, state: true,  message: `인증번호가 전송되었습니다.` });
})

exports.mobileAuthCheck = tryCatch(async(req, res) => {
    const { mobile, mobileAuth } = req.body;
    // const mobileAuthSend = await redisClient.get(`verify:${mobile}`)
    // const isAuthCheck = mobileAuth === mobileAuthSend;
    const isAuthCheck = mobileAuth === '111111';
    let message = '인증이 완료되었습니다.';    
    
    if(!isAuthCheck){
        message = '인증번호를 다시 확인해주세요.';    
    }

    res.status(200).json({result: true, state: isAuthCheck,  message });
})
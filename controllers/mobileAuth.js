const { tryCatch, dbQuery } = require('../utils');
const redisClient = require('../utils/redisClient');
const coolsms = require("coolsms-node-sdk").default;

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

exports.typeResult = tryCatch(async(req, res, next) => {
    const { isMobile } = req;
    const { type } = req.body;
    
    if(!type) {
        return res.status(200).json({result: true, state: false, message: `type 값이 없습니다.`});
    }

    if(type === 'signUp' && isMobile){
        return res.status(200).json({result: true, state: false, message: `이미 가입된 번호입니다.`});
    }

    if(type === 'find' && !isMobile){
        return res.status(200).json({result: true, state: false, message: `가입된 휴대폰 번호가 없습니다.`});
    }
    
    // req.typeResult = name;
    
    next();
})
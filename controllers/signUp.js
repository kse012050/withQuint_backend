const bcrypt = require('bcrypt');
const { tryCatch, dbQuery } = require('../utils');
const { CoolsmsMessageService } = require('coolsms-node-sdk');
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


exports.mobile = tryCatch(async(req, res) => {
    console.log(process.env.MOBILE_API_KEY);
    console.log(process.env.MOBILE_API_SECRET);
    const messageService = new coolsms(process.env.MOBILE_API_KEY, process.env.MOBILE_API_SECRET);

    const response = await messageService.sendOne({
        to: '01038698607',
        from: '01092931656',
        text: `[인증번호] 를 입력해주세요.`,
    });
})
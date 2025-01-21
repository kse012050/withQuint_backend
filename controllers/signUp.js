const bcrypt = require('bcrypt');
const { tryCatch, dbQuery } = require('../utils');

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
    console.log(req.DBName, 111);
    
    
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

    res.status(200).json({result: !result.length, message: `사용할 수 ${result.length ? '없는' : '있는'} 아이디 입니다` });
    
})
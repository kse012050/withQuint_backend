const { tryCatch, dbQuery } = require('../utils');

exports.required = tryCatch(async(req, res, next) =>{
    const result = await dbQuery(`DESCRIBE ${req.DBName}`);
    
    const required = result.filter(data=> data.Key !== 'PRI' && data.Type !== 'datetime' && data.Null === 'NO').map(data=> data.Field)
    
    const noRequired = required.filter((key)=>!req.body[key])

    if(noRequired.length){
        return res.status(400).json({result: false, error: `${noRequired.join(', ')} 값이 없습니다.`})
    }

    req.fields = required;
    next();
})
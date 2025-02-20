const { tryCatch, dbQuery } = require('../utils');

exports.required = tryCatch(async(req, res, next) =>{
    const result = await dbQuery(`DESCRIBE ${req.DBName}`);
    
    let required = result.filter(data=> data.Key !== 'PRI' && !data.Default && data.Null === 'NO').map(data=> data.Field)
    
    if(req.required){
        required = [...required, ...req.required]
        req.body.image = `/img/${req.DBName ? `${req.DBName}/`: ''}${req.file.filename}`
    }
    
    const noRequired = required.filter((key)=>!req.body[key])
    
    if(noRequired.length){
        return res.json({result: false, error: `${noRequired.join(', ')} 값이 없습니다.`})
    }

    req.fields = required;
    next();
})

exports.getFieldsAndValues = tryCatch(async(req, res, next) => {
    const keys = []
    const values = []

    Object.entries(req.body).forEach(([key, value])=>{
        keys.push(key);
        values.push(value);
    })

    req.keys = keys;
    req.values = values;

    next();
})
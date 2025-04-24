const jwt = require('jsonwebtoken');
const { tryCatch, dbQuery } = require('../utils');

exports.permission = tryCatch(async(req, res, next) => {
    const { isAdmin, originalUrl } = req;
    const { boardType } = req.body;
    const boardsAdmin = ['recommendation', 'revenue', 'stock', 'notice'];
    const boardsUser = ['vip', 'clinic'];
    const token = req.cookies[`${isAdmin ? 'admin' : 'user'}AccessToken`];
    
    if(!token || (!(isAdmin && boardsAdmin.includes(boardType)) && !boardsUser.includes(boardType))) {
        return res.status(200).json({ result: true, state: false, message: '권한이 없습니다.' });
    }
    req.author = jwt.decode(token).id;

    next();
    
})

exports.required = tryCatch(async(req, res, next) =>{
    const result = await dbQuery(`DESCRIBE ${req.DBName}`);
    
    let required = result.filter(data=> data.Key !== 'PRI' && !data.Default && data.Null === 'NO').map(data=> data.Field)
    
    if(req.author){
        required = required.filter((key) => key !== 'author')
    }
    
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
    let id = ''
    
    Object.entries(req.body).forEach(([key, value])=>{
        if(value === 'y' || value === 'n'){
            value = value === 'y'
        }
        if(key !== 'boardId'){
            keys.push(key);
            values.push(value);
        }else{
            id = value;
        }
    })

    if(req.author){
        keys.push('author')
        values.push(req.author)
    }
    
    req.keys = keys;
    req.values = values;
    req.id = id;

    next();
})
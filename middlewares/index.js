const db = require('../config/db');

exports.required = (req, res, next) => {
    let schemaName;
    
    if(req.originalUrl === '/signUp'){
        schemaName = 'users';
    }
    
    try {
        db.query(`DESCRIBE ${schemaName}`,async (error, result)=>{
            if(error) {
                throw error;
            }
            const required = result.filter(data=> data.Key !== 'PRI' && data.Type !== 'datetime' && data.Null === 'NO').map(data=> data.Field)
            
            const noRequired = required.filter((key)=>!req.body[key])

            if(noRequired.length){
                res.status(400).json({result: false, error: `${noRequired.join(', ')} 값이 없습니다.`})
                return;
            }else{
                req.fields = required;
                next();
            }

        })
    } catch (error) {
        console.error(error);
    }
}
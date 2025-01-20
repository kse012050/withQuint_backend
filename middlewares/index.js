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
            // 데이터 베이스 필수 필드 확인
            const required = result.filter(data=> data.Key !== 'PRI' && data.Type !== 'datetime' && data.Null === 'NO').map(data=> data.Field)
            
            // 필수 값 중 들어온 값이 없을 때 리스트 생성
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
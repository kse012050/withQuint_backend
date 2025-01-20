const db = require('../config/db');
const bcrypt = require('bcrypt');
const { asyncHandler, dbQuery } = require('../utils');

// exports.signUp = async(req, res, next) => {
    
//     try{
//         const values = await Promise.all(
//             Object.entries(req.body).map(async ([key, value]) => key === 'password' ? await bcrypt.hash(value, 12) : value)
//         );

//         db.query(
//             `
//                 INSERT INTO users 
//                 (${req.fields.join(',')}, created)
//                 VALUES (${req.fields.map(()=>'?').join(',')}, NOW())
//             `,
//             values
//             ,
//             (error, result)=>{
//                 if(error){
//                     next();
//                     return;
//                 };
//                 res.status(200).json({result: true})
//             }
//         )
//     }catch(error){
//         console.error(error);
//     }
// }

exports.signUp = asyncHandler(async(req, res) => {
    const values = await Promise.all(
        Object.entries(req.body).map(async ([key, value]) => key === 'password' ? await bcrypt.hash(value, 12) : value)
    );

    /* const result =  */await dbQuery(
        `
            INSERT INTO users 
            (${req.fields.join(',')}, created)
            VALUES (${req.fields.map(()=>'?').join(',')}, NOW())
        `,
        values
    );
    // console.log(result);
    

    res.status(200).json({result: true})
})

// exports.check = (req, res, next) => {
//     // const { type, value } = req.body;
//     const { type, value } = {};
    
//     // if(!type || !value) res.status(400).send(`${type} 값이 없습니다.`);
//     try {
//         db.query(
//             `
//                 SELECT ${type}
//                 FROM users
//                 WHERE ${type} = ?;
//             `,
//             value,
//             (error, result)=>{
//                 if(error){
//                     return next(error);
//                 };
//                 res.status(200).json({result: !result.length, message: `사용할 수 ${result.length ? '없는' : '있는'} 아이디 입니다` });
//             }
//         )
//     } catch (error){
//         next(error)
//     }
// }

exports.check = asyncHandler(async(req, res) => {
    const { type, value } = req.body;
    
    if(!type || !value) {
        const errValues = ['type', 'value'].filter((key) => !req.body[key]);
        return res.status(400).json({result: false, error: `${errValues.join(', ')} 값이 없습니다.`});
    }
    

    const result = await dbQuery(
        `
            SELECT ${type}
            FROM users
            WHERE ${type} = ?;
        `,
        value
    );

    res.status(200).json({result: !result.length, message: `사용할 수 ${result.length ? '없는' : '있는'} 아이디 입니다` });
    
})
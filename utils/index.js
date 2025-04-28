const db = require("../config/db")
const jwt = require("jsonwebtoken");

const tryCatch = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

const dbQuery = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, result) => {
            if(error){
                // console.error('MySQL Error:', error);
                // res.status(200).json({result: false})
                return reject(error);
            }
            resolve(result)
        })
    })
}

const jwtVerifyAsync = (token, secret) =>
    new Promise((resolve) => {
        jwt.verify(token, secret, (err, decoded) => {
            resolve(decoded || null);
        });
});

const fieldsDataChange = (DBName, fields) => {
    const isBooleanField = ['new', 'secret'];

    return fields.map((name) => {
        const tableField = `${DBName}.${name}`;
        // fields 명시, boolean AS 'y' or 'n'
        if (isBooleanField.includes(name)) {
            return `CASE WHEN ${tableField} = 1 THEN 'y' ELSE 'n' END AS ${name}`;
        }
        if (name === 'type') {
            return `CASE WHEN ${tableField} = 'free' THEN '무료' ELSE 'VIP' END AS ${name}`;
        }
        // 날짜 변경
        if (name === 'created') {
            return `DATE_FORMAT(${tableField}, '%Y.%m.%d') AS ${name}`;
        }
        // fields 명시, visible AS '노출' or '숨김'
        if (name === 'visible') {
            return `CASE WHEN ${tableField} = 1 THEN 'y' ELSE 'n' END AS ${name}`;
        }

        if (name === 'image') {
            return `CONCAT('http://${process.env.HOST}:${process.env.PORT}', image) AS image`;
        }
    
        return tableField;
    });
}

module.exports = { tryCatch, dbQuery, jwtVerifyAsync, fieldsDataChange };
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
                console.error('MySQL Error:', error);
                res.status(200).json({result: false})
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

module.exports = { tryCatch, dbQuery, jwtVerifyAsync };
const db = require("../config/db")


const tryCatch = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

const dbQuery = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (error, result) => {
            if(error){
                return reject(error);
            }
            resolve(result)
        })
    })
}

module.exports = { tryCatch, dbQuery };
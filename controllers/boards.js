const { tryCatch, dbQuery } = require('../utils');

exports.create = tryCatch(async(req, res, next) => {
    console.log(req.body);
    console.log(req.fields);
    
})
const { imgUrl, imgUpload } = require('../uploads');
const { tryCatch, dbQuery } = require('../utils');

exports.create = tryCatch(async(req, res, next) => {
    await dbQuery(
        `
            INSERT INTO ${req.DBName}
            (${req.keys.join(',')})
            VALUES (${req.keys.map(()=>'?').join(',')})
        `,
        req.values
    )

    if(req.file){
        imgUpload(req, res, next)
    }

    res.status(200).json({result: true})
});

exports.read = tryCatch(async(req, res, next) => {
    const list = imgUrl(req.hostname, await dbQuery(`SELECT * FROM vipProducts ORDER BY created DESC`));

    res.status(200).json({result: true, list})
})
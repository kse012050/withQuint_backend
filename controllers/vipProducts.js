const { imgUrl } = require('../uploads');
const { tryCatch, dbQuery } = require('../utils');

exports.create = tryCatch(async(req, res, next) => {
    const image = req.file;
    const keys = []
    const values = []

    Object.entries(req.body).forEach(([key, value])=>{
        keys.push(key);
        values.push(value);
    })

    if(image){
        keys.push('image')
        values.push(`/img/${req.DBName ? `${req.DBName}/`: ''}${image.filename}`)
    }
    
    await dbQuery(
        `
            INSERT INTO ${req.DBName}
            (${keys.join(',')}, created)
            VALUES (${keys.map(()=>'?').join(',')}, NOW())
        `,
        values
    )

    res.status(200).json({result: true})
});

exports.read = tryCatch(async(req, res, next) => {
    const list = imgUrl(req.hostname, await dbQuery(`SELECT * FROM vipProducts ORDER BY created DESC`));

    res.status(200).json({result: true, list})
})
const { imgUrl, imgUpload } = require('../uploads');
const { tryCatch, dbQuery, fieldsDataChange } = require('../utils');

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
    const { path, isAdmin } = req;
    const fields = ['name', 'image', 'description', 'DATE_FORMAT(created, "%Y.%m.%d") as created'];

    if(!isAdmin || path.includes('detail')){
        fields.push('nameEng', 'price');  
    }

    if(isAdmin){
        fields.push('id', `CASE WHEN visible = 1 THEN '노출' ELSE '숨김' END AS visible`)
    }

    let list = imgUrl(await dbQuery(`SELECT ${fields} FROM vipProducts ORDER BY created DESC`));
    // if(!isAdmin){
    //     list = list.map(({ visible, ...rest }) => rest);
    // }
    list = list.map((data, idx) => ({
        ...data,
        numb: ++idx,
    }))
    
    res.status(200).json({result: true, state: !!list, list})
})

exports.detail = tryCatch(async(req, res, next) => {
    const { DBName } = req;
    const { boardId } = req.query;
    let fields = ['id', 'name', 'nameEng', 'price', 'description', 'image', 'created', 'visible'];

    fields = fieldsDataChange(DBName, fields)

    let [data] = await dbQuery(
        `
            SELECT ${fields.join(',')}
            FROM ${DBName}
            WHERE id = ?
            ORDER BY created DESC
        `,
        [boardId]
    )
    console.log(data);

    res.status(200).json({result: true, state: !!data, data})
    
})
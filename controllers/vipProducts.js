const { imgUrl, imgUpload, imgRemove } = require('../uploads');
const { tryCatch, dbQuery, fieldsDataChange } = require('../utils');

exports.create = tryCatch(async(req, res, next) => {
    const { DBName, keys, values, file } = req;
    
    await dbQuery(
        `
            INSERT INTO ${DBName}
            (${keys.join(',')})
            VALUES (${keys.map(()=>'?').join(',')})
        `,
        values
    )

    if(file){
        imgUpload(DBName, file)
    }

    res.status(200).json({result: true, state: true, message: '등록되었습니다.'})
});

exports.read = tryCatch(async(req, res, next) => {
    const { path, isAdmin } = req;
    const fields = ['id', 'name', 'image', 'description', 'DATE_FORMAT(created, "%Y.%m.%d") as created'];

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
    const { vipProductId } = req.query;
    let fields = [/* 'id', 'name', 'nameEng', 'price', 'description', */ 'image', 'created', 'visible'];
    
    fields = fieldsDataChange(DBName, fields)

    let [data] = await dbQuery(
        `
            SELECT *, ${fields.join(',')}
            FROM ${DBName}
            WHERE id = ?
            ORDER BY created DESC
        `,
        [vipProductId]
    )
    // console.log(data);

    res.status(200).json({result: true, state: !!data, data})
    
})

exports.update = tryCatch(async(req, res, next) => {
    const { DBName, keys, values, id, file } = req;

    if(file){
        imgUpload(DBName, file)
        imgRemove(DBName, id);
    }
    
    await dbQuery(
        `
            UPDATE ${DBName}
            SET ${keys.map(key => `${key} = ?`).join(', ')}
            WHERE id = ?
        `,
        [...values, id]
    );
    
    res.status(200).json({result: true, state: true, message: '수정되었습니다.'})
})

exports.remove = tryCatch(async(req, res, next) => {
    const { DBName, id } = req;
    
    // 이미지 파일 삭제
    imgRemove(DBName, id)

    // 데이터베이스에서 삭제
    await dbQuery(`DELETE FROM ${DBName} WHERE id = ?`, id);

    res.status(200).json({result: true, state: true, message: '삭제되었습니다.'})
})
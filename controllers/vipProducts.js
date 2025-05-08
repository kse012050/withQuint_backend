const { imgUpload, imgRemove } = require('../uploads');
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
    const { DBName, path, isAdmin } = req;
    const fields = ['id', 'name', 'image', 'description', 'created'];
    let conditions = [];
    let isDataHangle = true;

    if(!isAdmin || path.includes('detail')){
        fields.push('nameEng', 'price');
    }

    if(isAdmin){
        fields.push(`visible`);
    }else{
        conditions.push('visible = 1');
    }

    let list = await dbQuery(
        `
            SELECT ${fieldsDataChange(DBName, fields, isDataHangle)}
            FROM vipProducts
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            ORDER BY created DESC
        `
    );
   
    list = list.map((data, idx) => ({
        ...data,
        numb: ++idx,
    }))
    
    res.status(200).json({result: true, state: !!list, list})
})

exports.detail = tryCatch(async(req, res, next) => {
    const { DBName } = req;
    const { vipProductId } = req.query;
    const fields = [/* 'id', 'name', 'nameEng', 'price', 'description', */ 'image', 'created', 'visible'];
    
    const [data] = await dbQuery(
        `
            SELECT *, ${fieldsDataChange(DBName, fields)}
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
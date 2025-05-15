const { imgUpload, imgUrl, imgRemove } = require('../uploads');
const { tryCatch, dbQuery, fieldsDataChange } = require('../utils');
const path = require('path');
const fs = require('fs');

exports.main = tryCatch(async(req, res, next) => {
    let [ { data } ] = await dbQuery(
        `
            SELECT JSON_OBJECTAGG(
                boardType,
                json_data
            ) AS data
            FROM (
                SELECT boardType,
                    JSON_ARRAYAGG(
                        JSON_MERGE_PATCH(
                            JSON_OBJECT(
                                'id', id,
                                'title', title,
                                'created', created,
                                'author', userId
                            ),
                            CASE 
                                WHEN boardType = 'stock' AND image IS NOT NULL THEN 
                                    JSON_OBJECT('image', CONCAT('http://${process.env.IMAGE_HOST}:${process.env.PORT}', image))
                                ELSE 
                                    JSON_OBJECT()  
                            END,
                            CASE 
                                WHEN boardType IN ('vip', 'clinic') THEN JSON_OBJECT('secret', CASE 
                                                                                                    WHEN secret = 1 THEN 'y' 
                                                                                                    WHEN secret = 0 THEN 'n' 
                                                                                                    ELSE NULL 
                                                                                                END) 
                                ELSE JSON_OBJECT()
                            END
                        )
                    ) AS json_data
                FROM (
                    SELECT b.id, b.boardType, b.title, 
                        DATE_FORMAT(b.created, '%Y.%m.%d') AS created,
                        b.image, u.userId, b.secret
                    FROM (
                        SELECT *, ROW_NUMBER() OVER (
                                    PARTITION BY boardType 
                                    ORDER BY created DESC
                                ) AS row_num
                        FROM boards
                        WHERE boardType IN ('recommendation', 'revenue', 'stock', 'vip', 'clinic', 'notice')
                        AND visible = 1
                    ) AS b
                    LEFT JOIN users u ON b.author = u.id
                    WHERE 
                        (b.boardType = 'stock' AND row_num <= 2)  
                        OR (b.boardType != 'stock' AND row_num <= 5)
                ) AS filtered
                GROUP BY boardType
            ) AS grouped;
        `
    )
    
    res.status(200).json({result: true, state: true, data})
})

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

    // 이미지가 있는 경우 - 이미지 파일 저장
    if(file){
        imgUpload(DBName, file)
    }
    
    res.status(200).json({result: true, state: true, message: '등록되었습니다.'})
})

exports.read = tryCatch(async(req, res, next) => {
    const { DBName, isAdmin, query } = req;
    const { boardType, page = 1, search, type, dateStart, dateEnd } = query;
    // boardType
    // recommendation, revenue, stock, vip, clinic, notice
    const limit = 10;
    let fields = ['id', 'title', `new`, 'created']
    const isTypeField = ['recommendation', 'revenue']
    const isImageField = ['stock']
    const isSecretField = ['vip', 'clinic'];
    const isAuthorField = ['vip', 'clinic'];
    let joinConditions = ''
    let conditions = [`boardType = ?`];
    let values = [boardType];
    let isDataHangle = true;


    // 출력 필드 추가
    if(isAdmin){
        fields.push('visible')
    }else{
        conditions.push(`visible = 1`)
    }
    

    if(isTypeField.includes(boardType)){
        fields.push('type')
    }
    
    if(isImageField.includes(boardType)){
        fields.push('image')
    }

    if(isSecretField.includes(boardType)){
        fields.push(`secret`)
    }

    // 작성자 추가
    if(isAuthorField.includes(boardType)){
        fields.push(`users.nickname`)
        joinConditions = 'LEFT JOIN users ON boards.author = users.id'
    }

    // 페이징, 검색
    if (search) {
        conditions.push(`title LIKE ?`);
        values.push(`%${search}%`);
    }

    if (type) {
        conditions.push(`type = ?`);
        values.push(type);
    }

    if (dateStart && dateEnd) {
        conditions.push(`DATE(${DBName}.created) BETWEEN '${dateStart}' AND '${dateEnd}'`);
    }


    const [{ totalCount }] = await dbQuery(
        `
            SELECT COUNT(*) AS totalCount
            FROM ${DBName}
            WHERE ${conditions.join(' AND ')};
        `,
        values
    )
    
    let list = await dbQuery(
        `
            SELECT ${fieldsDataChange(DBName, fields, isDataHangle)}
            FROM ${DBName}
            ${joinConditions}
            WHERE ${conditions.join(' AND ')}
            ORDER BY boards.created DESC
            LIMIT ${limit} OFFSET ${(limit * ((page || 1) - 1))};
        `,
        values
    )
    
    list = list.map((data, idx) => ({
        ...data,
        numb: totalCount - (page - 1) * limit - idx,
    }))

    const info = {
        totalCount,
        limit,
        page: Number(page),
        totalPage: Math.ceil(totalCount / limit),
    }

    res.status(200).json({result: true, info, list})
})

exports.isSecret = tryCatch(async(req, res, next) => {
    const { DBName, id } = req;
    const token = req.cookies.userAccessToken;
    const [{ authorId }] = await dbQuery(
        
        `
            SELECT author AS authorId
            FROM ${DBName}
            WHERE id = ?
        `,
        id
    )
    const isSecretUser = !!token && authorId == JSON.parse(atob(token.split(".")[1])).id
    
    res.status(200).json({result: true, state: isSecretUser})
})

exports.detail = tryCatch(async(req, res, next) => {
    const { DBName, isAdmin, query } = req;
    const { boardId, boardType } = query;
    let fields = ['id', 'title', 'content', 'content', 'created'];
    const isPrevNext = ['recommendation', 'revenue', 'stock'];
    const isSecretField = ['vip', 'clinic'];
    const isSecret = isSecretField.includes(boardType);
    const isAdminTypeField = ['recommendation', 'revenue'];
    const isAdminImageField = ['stock'];
    let joinConditions = ''
    let values = [boardId, boardType]
    let isDataHangle = false;

    if(isSecret){
        fields.push(`secret`)
    }

    if(isAdmin){
        fields.push(`visible`)
        if(isAdminTypeField.includes(boardType)){
            fields.push(`type`)
        }
        if(isAdminImageField.includes(boardType)){
            fields.push(`image`)
        }
    }
    

    // 작성자 추가
    if(!isAdmin){
        fields.push(`${!isSecret ? 'admin' : 'users'}.nickname`)
        joinConditions = `LEFT JOIN ${!isSecret ? 'admin' : 'users'} ON boards.author = ${!isSecret ? 'admin' : 'users'}.id`
    }

    // 이전, 다음 글
    if(!isAdmin && isPrevNext.includes(boardType)){
        fields.push('prev')
        fields.push('next')
    }

    
    let [data] = await dbQuery(
        `
            WITH params AS (
                SELECT ? AS boardId, ? AS boardType
            )
            SELECT ${fieldsDataChange(DBName, fields, isDataHangle)}
            FROM ${req.DBName}
            ${joinConditions}
            , params p  
            WHERE boards.id = p.boardId AND boards.boardType = p.boardType
            ORDER BY boards.created DESC
        `,
        values
    )
    
    data = data && { data: data }

    // 이전/다음 글 쿼리
    if(data?.data.prev || data?.data.next){
        let post = {}
        const [prev, next] = await dbQuery(
            `
                SELECT 
                    boards.id, 
                    boards.title
                FROM boards AS boards
                WHERE boards.id IN (?, ?);
            `,
            [data.data.prev, data.data.next]
        );
        post.prev = prev;
        post.next = next;
        data = {...data, post}
    }
    
    if(isSecretField.includes(boardType)){
        // access 토큰이 만료 되었을 때 ( refesh 토근 있음 ) access 토큰 새로 받아 올 수 있나?
        const token = req.cookies.userAccessToken;
        const [{ authorId }] = await dbQuery(
            
            `
                SELECT author AS authorId
                FROM ${DBName}
                WHERE id = ?
            `,
            boardId
        )
        const isSecretUser = !!token && authorId == JSON.parse(atob(token.split(".")[1])).id
        
        data = { ...data, isSecretUser };
    }
    
    
    if(Object.keys(data.data).some((key) => key ==='image')){
        [data.data] = imgUrl([data.data])
    }
    
    res.status(200).json({result: true, state: !!data, ...data})
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
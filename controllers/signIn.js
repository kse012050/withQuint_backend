const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { tryCatch, dbQuery, jwtVerifyAsync } = require('../utils');

function tokenFuc(info, name){
    const types = ['Access', 'Refresh']
    const times = {
        // Access: '10s',
        Access: '1d',
        Refresh: '1d'
    }

    const options = {  
        httpOnly: true, 
        sameSite: "Strict",
        // secure: true   // https
    }
    
    return (res) => {
        types.forEach((type) => {
            res.cookie(
                `${name}${type}Token`,
                jwt.sign(
                    tokenSaveData(info, name),
                    process.env[`${type.toUpperCase()}_TOKEN_SECRET`],
                    { expiresIn: times[type] }
                ), 
                options
            );
        })
    }
}


function tokenSaveData(user, name){
    const obj = {
        'user': {
            userId: user.userId
        },
        'admin': {
            isSuper: !!user.isSuper
        }
    }
    return { id: user.id, ...obj[name] };
}

exports.signIn = tryCatch(async(req, res, next) => {
    let { password } = req.body;
    const { isAdmin } = req;
    const name = !isAdmin ? 'user' : 'admin';
    let idName = `${name}Id`;
    let id = req.body[`${idName}`];
    const outputFields = ['id', 'password', idName];
    if(isAdmin){
        outputFields.push('isSuper')
    }
    
    // 유저 아이디 확인
    const [ user ] = await dbQuery(`SELECT ${outputFields.join(',')} FROM ${req.DBName} WHERE ${idName} = ?`, id);
    
    // 유저 비밀번호 확인
    const state = await bcrypt.compare(password, user?.password || '');

    const message = state ? '로그인 성공' : '아이디 또는 비밀번호를 확인해주세요.';
    
    if(state){
        tokenFuc(user, name)(res)
        req.session[name] = tokenSaveData(user, name)

        // 최종 로그인
        if(!isAdmin){
            await dbQuery(
                `
                    UPDATE users
                    SET lastLogin = NOW()
                    WHERE userId = ?;
                `,
                id
            )
        }
    }

    res.status(200).json({result: true, state, message, user: req.session.user})
})

// const jwtVerifyAsync = (token, secret) =>
//     new Promise((resolve) => {
//         jwt.verify(token, secret, (err, decoded) => {
//             resolve(decoded || null);
//         });
// });

exports.auth = tryCatch(async(req, res, next) => {
    const name = !req.isAdmin ? 'user' : 'admin';
    const info = req.session[name];
    let accessToken = req.cookies[`${name}AccessToken`];
    const refreshToken = req.cookies[`${name}RefreshToken`];
    
    if (!info && refreshToken) {
        const accessDecoded = await jwtVerifyAsync(accessToken, process.env.ACCESS_TOKEN_SECRET);
      
        if (accessDecoded) {
            req.session[name] = tokenSaveData(accessDecoded, name);
        } else {
            const refreshDecoded = await jwtVerifyAsync(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
            if (refreshDecoded) {
                tokenFuc(refreshDecoded, name)(res);
                req.session[name] = tokenSaveData(refreshDecoded, name);
            } else {
                req.cookies[`${name}AccessToken`] = '';
                req.cookies[`${name}RefreshToken`] = '';
            }
        }
    }

    
    const isLogin = !!req.session[name]
    const message = isLogin ? '로그인 상태입니다.' : '로그인 상태가 아닙니다.';

    res.status(200).json({result: true, message, state: isLogin, isLogin, user: req.session.user})
})


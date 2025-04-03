const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { tryCatch, dbQuery } = require('../utils');

function tokenFuc(info, name){
    const types = ['access', 'refresh']
    const times = {
        access: '10s',
        // access: '1d',
        refresh: '1d'
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
                    tokenSaveData(info),
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
    const name = !req.isAdmin ? 'user' : 'admin';
    let idName = `${name}Id`;
    let id = req.body[`${idName}`];
    const outputFields = ['id', 'password', idName];
    if(req.isAdmin){
        outputFields.push('isSuper')
    }
    
    // 유저 아이디 확인
    const [ user ] = await dbQuery(`SELECT ${outputFields.join(',')} FROM ${req.DBName} WHERE ${idName} = ?`, id);
    console.log(user);
    
    // 유저 비밀번호 확인
    const result = await bcrypt.compare(password, user.password);

    const message = result ? '로그인 성공' : '비밀번호가 일치하지 않습니다.';
    
    
    if(result){
        tokenFuc(user, name)(res)
        req.session[name] = tokenSaveData(user, name)
    }
    console.log(req.session.user);

    res.status(200).json({result, message, user: req.session.user})
})

const jwtVerifyAsync = (token, secret) =>
    new Promise((resolve) => {
        jwt.verify(token, secret, (err, decoded) => {
            resolve(decoded || null);
        });
});

exports.auth = tryCatch(async(req, res, next) => {
    const name = !req.isAdmin ? 'user' : 'admin';
    const info = req.session[name];
    let accessToken = req.cookies[`${name}accessToken`];
    const refreshToken = req.cookies[`${name}refreshToken`];
    
    if (!info && refreshToken) {
        const accessDecoded = await jwtVerifyAsync(accessToken, process.env.ACCESS_TOKEN_SECRET);
      
        if (accessDecoded) {
            req.session[name] = tokenSaveData(accessDecoded);
        } else {
            const refreshDecoded = await jwtVerifyAsync(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        
            if (refreshDecoded) {
                tokenFuc(refreshDecoded, name)(res);
                req.session[name] = tokenSaveData(refreshDecoded);
            } else {
                accessToken = '';
                refreshToken = '';
            }
        }
    }

    
    const isLogin = !!req.session[name]
    const message = isLogin ? '로그인 상태입니다.' : '로그인 상태가 아닙니다.';

    res.status(200).json({result: true, message, isLogin, user: req.session.user})
})


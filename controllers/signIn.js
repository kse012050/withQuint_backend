const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { tryCatch, dbQuery } = require('../utils');

function tokenFuc(user, name){
    const time = {
        access: '10s',
        // access: '1d',
        refresh: '1d'
    }
    
    return (res) => {
        res.cookie(
            `${name}Token`,
            jwt.sign(
                tokenSaveData(user),
                process.env[`${name.toUpperCase()}_TOKEN_SECRET`],
                { expiresIn: time[name] }
            ), 
            { 
                httpOnly: true, 
                sameSite: "Strict",
                // secure: true   // https
             }
        );
    }
}


function tokenSaveData(user){
    return { id: user.id, userId: user.userId };
}

exports.signIn = tryCatch(async(req, res, next) => {
    let { userId, password, authLogin } = req.body;
    
    // 유저 아이디 확인
    const [ user ] = await dbQuery(`SELECT id, userId, password FROM ${req.DBName} WHERE userId = ?`, userId);

    // 유저 비밀번호 확인
    const result = await bcrypt.compare(password, user.password);

    const message = result ? '로그인 성공' : '비밀번호가 일치하지 않습니다.';
    
    if(result){
        tokenFuc(user, 'access')(res)
        tokenFuc(user, 'refresh')(res)
        req.session.user = tokenSaveData(user)
    }

    res.status(200).json({result, message, user: req.session.user})
})

exports.auth = tryCatch(async(req, res, next) => {
    const user = req.session.user;
    let accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    
    if(!user && refreshToken){
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err){
                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                    if (err){
                        // console.log(err);
                        accessToken = ''
                        refreshToken = ''
                    };
                    
                    if(decoded){
                        tokenFuc(decoded, 'access')(res)
                        req.session.user = tokenSaveData(decoded)
                    }
                })
            }
            if(decoded){
                req.session.user = tokenSaveData(decoded)
            }
        })
    }
    
    const message = req.session.user ? '로그인 상태입니다.' : '로그인 상태가 아닙니다.';

    res.status(200).json({result: true, message, user: req.session.user})
})


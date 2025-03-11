const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { tryCatch, dbQuery } = require('../utils');

exports.signIn = tryCatch(async(req, res, next) => {
    let { userId, password, authLogin } = req.body;
    
    // 유저 아이디 확인
    const [ user ] = await dbQuery(`SELECT userId, password FROM ${req.DBName} WHERE userId = ?`, userId);

    // 유저 비밀번호 확인
    const result = await bcrypt.compare(password, user.password);

    const message = result ? '로그인 성공' : '비밀번호가 일치하지 않습니다.';
    
    if(result){
        req.session.user = { userId: user.userId }
        if(authLogin === 'y'){
            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
        }
        const accessToken = jwt.sign(
            { id: user.userId },
            process.env.ACCESS_TOKEN_SECRET,
        );

        res.cookie("isLogin", accessToken, { 
            httpOnly: true, sameSite: "Strict",
            // secure: true   // https
         });
        
    }

    res.status(200).json({result, message, session: req.session.user, sessionId: req.sessionID})
})

exports.auth = tryCatch((req, res) => {
    const token = req.cookies.isLogin;

    const base64Payload = token.split(".")[1]; // 두 번째 부분 (Payload)
    const decodedPayload = JSON.parse(atob(base64Payload)); // Base64 디코딩

    console.log(decodedPayload);
    
    token && jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        req.session.user = decoded && { userId: decoded?.id }
    })
    
    const isLogin = !!req.session.user;
    const message = isLogin ? '로그인 상태입니다.' : '로그인 상태가 아닙니다.';

    res.status(200).json({result: true, isLogin, message})
})
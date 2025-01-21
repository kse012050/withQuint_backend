const bcrypt = require('bcrypt');
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
    }

    res.status(200).json({result, message, session: req.session.user, sessionId: req.sessionID})
})

exports.auth = tryCatch((req, res) => {
    const isLogin = !!req.session.user;
    const message = isLogin ? '로그인 상태입니다.' : '로그인 상태가 아닙니다.';

    res.status(200).json({result: true, isLogin, message})
})
const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.signIn = (req, res, next) => {
    const { userId, password, authLogin } = req.body;
    
    try{
        db.query(`SELECT userId, password FROM users WHERE userId = ?`,
            [userId],
            async (error, result)=>{
                if(error){
                    return next(error)
                }
                if(result.length){
                    const [ user ] = result;
                    
                    let signInResult = await bcrypt.compare(password, user.password);
                    let message = '' 
                    
                    if(signInResult){
                        req.session.user = { userId: user.userId }
                        message = '로그인 성공.'
                        if(authLogin === 'y'){
                            req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
                        }
                    }else{
                        message = '비밀번호가 일치하지 않습니다.'
                    }
                    console.log(req.sessionID);
                    
                    res.status(200).json({result: signInResult, message, session: req.session.user, sessionId: req.sessionID})
                }else{
                    res.status(200).json({result: false, message: '사용자가 존재하지 않습니다.'})
                }

            }
        )
    }catch(error){
        console.error(error);
        next(error);
    }
}

exports.auth = (req, res) => {
    try{
        let isLogin = !!req.session.user;
        let message = ''
        if(isLogin){
            message = '로그인 상태입니다.'
        }else{
            message = '로그인 상태가 아닙니다.'
        }
        res.status(200).json({result: true, isLogin, message})
    } catch (error){
        console.error(error);
    }

}
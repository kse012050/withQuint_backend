
exports.logout = ( req, res ) => {
    const name = !req.isAdmin ? 'user' : 'admin';
    try{
        console.log('로그아웃');
        
        if(req.session.user){
            req.session.destroy((err)=>{
                if(err){
                    res.status(500).json({result: false, message: '서버 오류.'})
                    throw err;
                }
                res.clearCookie(`${name}accessToken`);
                res.clearCookie(`${name}refreshToken`);
                res.status(200).json({ result: true, message: '로그아웃되었습니다.' });
            })
        } else {
            res.status(200).json({ result: true, message: '로그인 상태가 아닙니다.' });
        }
    } catch (error){
        console.error(error);
    }
}
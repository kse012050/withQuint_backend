const { tryCatch, jwtVerifyAsync } = require("../utils");

exports.isAdminAuth = tryCatch(async (req, res, next) => {
    const accessToken = req.cookies.adminAccessToken;
    
    const accessDecoded = await jwtVerifyAsync(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if(!accessDecoded){
        return res.status(200).json({ result: true, state: false, message: '관리자 권한이 없습니다.' });
    }

    next();
})

exports.adminAddField = tryCatch(async (req, res, next) => {
    req.fields = ['visible'];
    next();
})

exports.logout = tryCatch(async (req, res, next) => {
    res.clearCookie('adminAccessToken');
    res.clearCookie('adminRefreshToken');
    
    return res.status(200).json({ result: true, state: true, message: '로그아웃되었습니다' });
})
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imgUpload = (req, res, next) => {
    const drectoryName = req.originalUrl.split('/')[1];
    const uploadFolder = path.join(__dirname, `${drectoryName ? `/${drectoryName}`: ''}`);

    if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
    }
    
     const upload = multer({
        storage: multer.diskStorage({
            destination(req, file, cb) {
                cb(null, `uploads/${drectoryName}`);
            },
            filename(req, file, cb) {
                const ext = path.extname(file.originalname);
                const uniqueName =
                    path.basename(file.originalname, ext) + '-' + Date.now() + ext;
                cb(null, uniqueName);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
    });

    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: '파일 업로드 실패', details: err });
        }
        next();
    });
};

// module.exports = { imgUpload }
// exports.imgUpload = imgUpload;
module.exports = imgUpload;
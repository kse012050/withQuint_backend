const multer = require('multer');
const path = require('path');
const fs = require('fs');

function imgFileName( file ){
    const ext = path.extname(file.originalname);
    const uniqueName = path.basename(file.originalname, ext) + '-' + Date.now() + ext;
    return uniqueName;
}

const limits = { fileSize: 5 * 1024 * 1024 }

const imgInfo = (req, res, next) => {
    if (req.headers['content-type']?.startsWith('multipart/form-data')) {
        const info = multer({
            storage: multer.memoryStorage(),
            limits
        });

        info.single('image')(req, res, (err) => {
            if (err) {
                return next(err);
            }
            
            req.required = ['image']
            req.file.filename = imgFileName(req.file);
            
            next();
        });
    }else{
        next();
    }
}

const imgUpload = (req, res, next) => {
    const directoryName = req.originalUrl.split('/')[1];
    const uploadFolder = path.join(__dirname, `${directoryName ? `/${directoryName}`: ''}`);

    if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const filePath = path.join(uploadFolder, req.file.filename);

    fs.writeFile(filePath, req.file.buffer, (err) => {
        if (err) {
            return next(err);
        }
    });
}


function imgUrl(hostName, data){
    return data.map((item) =>
        Object.entries(item).reduce((acc, [key, value]) => {
            acc[key] = key === "image" && value ? `http://${hostName}:8001${value}` : value;
            return acc;
        }, {})
    );
}

module.exports = { imgInfo, imgUpload, imgUrl };
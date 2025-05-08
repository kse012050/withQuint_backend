const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbQuery } = require('../utils');

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

const imgUpload = (DBName, file) => {
    // const directoryName = req.originalUrl.split('/')[1];
    // const uploadFolder = path.join(__dirname, `${directoryName ? `/${directoryName}`: ''}`);
    const uploadFolder = path.join(__dirname, DBName);

    if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const filePath = path.join(uploadFolder, file.filename);

    fs.writeFileSync(filePath, file.buffer, (err) => {
        if (err) {
            return next(err);
        }
    });
}

const imgRemove = async(DBName, id) => {
    const [{ image }] = await dbQuery(`SELECT image FROM ${DBName} WHERE id = ?`, id);

    if(!image) return;
    
    const filePath = path.join(__dirname, image.replace('/img', ''));
    
    fs.unlinkSync(filePath, (err) => {
        if (err) {
            console.error('파일 삭제 실패:', err);
            return next(err);
        }
        console.log('파일 삭제 성공');
    });
}


function imgUrl(data){
    return data.map((item) =>
        Object.entries(item).reduce((acc, [key, value]) => {
            acc[key] = key === "image" && value ? `http://${process.env.IMAGE_HOST}:${process.env.PORT}${value}` : value;
            return acc;
        }, {})
    );
}

module.exports = { imgInfo, imgUpload, imgUrl, imgRemove };
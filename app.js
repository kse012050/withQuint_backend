const express = require('express');
const mysql = require('mysql2');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');

const app = express();

dotenv.config();

const authRouter = require('./routes/auth');
const signInRouter = require('./routes/signIn');
const signUpRouter = require('./routes/signUp');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'withquint'
})

app.set('port', process.env.PORT || 8001);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/img', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

db.connect();

app.use(
    session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
      },
    })
);



// try{    

// } catch(error){
//     console.error(error);
// }


app.get('/', (req, res, next)=>{
    console.log(req);
    console.log(req.sessionID);
    console.log(req.session.user);
    console.log(req.session.password);
    res.end('test')
})

// 1. 업로드 폴더 설정
const uploadFolder = path.join(__dirname, 'uploads');

// 업로드 폴더가 없으면 생성
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb){
            cb(null, 'uploads/');
        },
        filename(req, file, cb){
            console.log(file);
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext)
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024}
});


app.post('/img', upload.single('image'), (req, res, next) => {
    console.log('file', req.file);
    console.log('image', req.image);
    
    const image = req.body.image;
    console.log(image);
    res.status(200).json({
        message: 'File uploaded successfully',
        fileInfo: image,
    });
});


app.post('/vipProducts', upload.single('image'), (req, res, next)=>{
    const image = req.file;
    
    
    try{
        db.query(`DESCRIBE vipProducts`,async (err, result)=>{
            const required = result.filter(data=> data.Key !== 'PRI' && data.Type !== 'datetime' && data.Null === 'NO').map(data=> data.Field)
            
            const noRequired = required.filter((key)=>!req.body[key])
          
            if(noRequired.length){
                res.status(400).json({result: false, error: `${noRequired.join(', ')} 값이 없습니다.`})
                return;
            }
          
          
            const keys = []
            const values = []
            Object.entries(req.body).forEach(([key, value])=>{
                keys.push(key);
                values.push(value);
            })

            if(image){
                keys.push('image')
                values.push(`/img/${image.filename}`)
            }
            
            db.query(
                `
                    INSERT INTO vipProducts 
                    (${keys.join(',')}, created)
                    VALUES (${keys.map(()=>'?').join(',')}, NOW())
                `,
                values
                ,
                (error, result)=>{
                    res.status(200).json({result: true})
                }
            )
        })
    } catch(error){
        console.error('A');
        console.error(error);
    }
    
})



// app.post('/signIn', (req, res, next)=>{
//     const { userId, password, authLogin } = req.body;
    
//     try{
//         db.query(`SELECT userId, password FROM users WHERE userId = ?`,
//             [userId],
//             async (error, result)=>{
//                 if(error){
//                     return next(error)
//                 }
//                 if(result.length){
//                     const [ user ] = result;
                    
//                     let signInResult = await bcrypt.compare(password, user.password);
//                     let message = '' 
                    
//                     if(signInResult){
//                         req.session.user = { userId: user.userId }
//                         message = '로그인 성공.'
//                         if(authLogin === 'y'){
//                             req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
//                         }
//                     }else{
//                         message = '비밀번호가 일치하지 않습니다.'
//                     }
//                     console.log(req.sessionID);
                    
//                     res.status(200).json({result: signInResult, message, session: req.session.user, sessionId: req.sessionID})
//                 }else{
//                     res.status(200).json({result: false, message: '사용자가 존재하지 않습니다.'})
//                 }

//             }
//         )
//     }catch(error){
//         console.error(error);
//         next(error);
//     }
// })

// app.post('/signIn/auth', (req, res, next)=>{
//     try{
//         let isLogin = !!req.session.user;
//         let message = ''
//         if(isLogin){
//             message = '로그인 상태입니다.'
//         }else{
//             message = '로그인 상태가 아닙니다.'
//         }
//         res.status(200).json({result: true, isLogin, message})
//     } catch (error){
//         console.error(error);
//     }
// })

// app.post('/logout', (req, res, next)=>{
//     try{
//         if(req.session){
//             req.session.destroy((err)=>{
//                 if(err){
//                     res.status(500).json({result: false, message: '서버 오류.'})
//                     throw err;
//                 }
//                 res.status(200).json({ result: true, message: '로그아웃되었습니다.' });
//             })
//         } else {
//             res.status(200).json({ result: true, message: '로그인 상태가 아닙니다.' });
//         }
//     } catch (error){
//         console.error(error);
//     }
// })

// app.post('/signUp', (req, res, next)=>{
//     try{
//         db.query(`DESCRIBE users`,async (err, result)=>{
//             const required = result.filter(data=> data.Key !== 'PRI' && data.Type !== 'datetime' && data.Null === 'NO').map(data=> data.Field)
            
//             const noRequired = required.filter((key)=>!req.body[key])
            
//             if(noRequired.length){
//                 res.status(400).json({result: false, error: `${noRequired.join(', ')} 값이 없습니다.`})
//                 return;
//             }
          
//             const values = await Promise.all(
//                 Object.entries(req.body).map(async ([key, value]) => key === 'password' ? await bcrypt.hash(value, 12) : value)
//             );

//             db.query(
//                 `
//                     INSERT INTO users 
//                     (${required.join(',')}, created)
//                     VALUES (${required.map(()=>'?').join(',')}, NOW())
//                 `,
//                 values
//                 ,
//                 (error, result)=>{
//                     if(error){
//                         res.status(400).json({result: false, error: '서버 에러입니다.'})
//                         throw error;
//                     };
//                     res.status(200).json({result: true})
//                 }
//             )
//         })
//     }catch(err){
//         console.error(err);
//     }
// })

// app.post('/signUp/check', (req, res, next)=>{
//     const { type, value } = req.body;
    
//     if(!type || !value) res.status(400).send(`${type} 값이 없습니다.`);
//     try {
//         db.query(
//             `
//                 SELECT ${type}
//                 FROM users
//                 WHERE ${type} = ?;
//             `,
//             // req.body.userId,
//             value,
//             (error, result)=>{
//                 if(error){
//                     res.status(400).json({result: false, error: '서버 에러입니다.'})
//                     throw error;
//                 };
//                 res.status(200).json({result: !result.length, message: `사용할 수 ${result.length ? '없는' : '있는'} 아이디 입니다` });
//             }
//         )
//     } catch (error){
//         console.error(error);
//     }
// })

app.use('/', authRouter);
app.use('/signIn', signInRouter);
app.use('/signUp', signUpRouter);

// 404 에러 미들웨어
app.use((req, res, next)=>{
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
    error.status = 404;
    next(error);
})

// 에러 미들웨어
app.use((err, req, res, next)=>{
    // console.error(err);
    console.log('에러 미들웨어');
    res.status(500).json({result: false, error: '서버 에러입니다.'})
})


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})

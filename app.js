const express = require('express');
const mysql = require('mysql2');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

dotenv.config();

const authRouter = require('./routes/auth');
const signInRouter = require('./routes/signIn');
const signUpRouter = require('./routes/signUp');
const vipProductsRouter = require('./routes/vipProducts');
const boardsRouter = require('./routes/boards');
const adminRouter = require('./routes/admin');
const usersRouter = require('./routes/users');

const db = mysql.createConnection({
    host: process.env.HOST,
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'withQuint'
})

app.set('port', process.env.PORT || 8001);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/img', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());

app.use(cors({
    // origin: 'http://localhost:3000',
    // origin: 'http://3.34.52.106',
    origin: [process.env.LOCALHOST,process.env.SERVER],
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
        maxAge: null,
      },
    })
);

app.get('/', (req, res, next)=>{
    console.log(req);
    console.log(req.sessionID);
    console.log(req.session.user);
    console.log(req.session.password);
    res.end('test')
})


// 들어온 path 값으로 DB 스키마 이름을 설정
app.use((req, res, next)=>{
    const pathname = new URL(req.get('Referer')).pathname; 
    const originUrl = req.originalUrl;
    const isAdmin = pathname.includes('admin');
    
    let schemaName = originUrl.split('/')[originUrl.includes('admin') ? 2 : 1];
    
    if(schemaName.includes('?')){
        schemaName = schemaName.split('?')[0];
    }
    
    if(schemaName.includes('sign')){
        schemaName = isAdmin ? 'admin' : 'users';
    }

    req.DBName = schemaName;
    req.isAdmin = isAdmin;
    
    next();
    
})

app.use('/', authRouter);
app.use('/signIn', signInRouter);
app.use('/signUp', signUpRouter);
app.use('/vipProducts', vipProductsRouter);
app.use('/boards', boardsRouter);
app.use('/admin', adminRouter);
app.use('/users', usersRouter);

// 404 에러 미들웨어
app.use((req, res, next)=>{
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
    error.status = 404;
    next(error);
})

// 에러 미들웨어
app.use((err, req, res, next)=>{
    console.error(err);
    console.log('에러 미들웨어');
    res.status(200).json({result: false, error: '서버 에러입니다.'})
})


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})

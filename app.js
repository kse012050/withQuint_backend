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

const db = mysql.createConnection({
    host: process.env.HOST,
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
    const isAdmin = new URL(req.get('Referer')).pathname.includes('admin');
    
    // 이건 뭐였지?
    // let schemaName = req.originalUrl.split('/').at(-1);
    // 게시물
    let schemaName = req.originalUrl.split('/')[1];
    // console.log(schemaName);
    // console.log(schemaName2);
    
    if(schemaName.includes('?')){
        schemaName = schemaName.split('?')[0];
    }

    if(schemaName === 'signUp' || schemaName === 'signIn'){
        schemaName = isAdmin ? 'admin' : 'users';
    }

    req.DBName = schemaName;
    isAdmin && (req.isAdmin = isAdmin);
    
    next();
    
    // let schemaName = req.originalUrl.split('/')[1];
    
    
    // if(schemaName.includes('?')){
    //     schemaName = schemaName.split('?')[0];
    // }

    // if(schemaName === 'signUp' || schemaName === 'signIn'){
    //     schemaName = 'users';
    // }
    // console.log(schemaName);
    
    // req.DBName = schemaName;
    
    // next();
})

app.use('/', authRouter);
app.use('/signIn', signInRouter);
app.use('/signUp', signUpRouter);
app.use('/vipProducts', vipProductsRouter);
app.use('/boards', boardsRouter);
app.use('/admin', adminRouter);

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
    res.status(500).json({result: false, error: '서버 에러입니다.'})
})


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})

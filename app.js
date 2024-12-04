const express = require('express');
const mysql = require('mysql2');
const morgan = require('morgan');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

dotenv.config();

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

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

db.connect();

app.get('/', (req, res, next)=>{
    console.log(req);
    console.log(res);
    res.end('test')
})


app.post('/signUp', (req, res, next)=>{
    try{
        db.query(`DESCRIBE users`,async (err, result)=>{
            const required = result.filter(data=> data.Key !== 'PRI' && data.Type !== 'datetime' && data.Null === 'NO').map(data=> data.Field)
            
            const noRequired = required.filter((key)=>!req.body[key])
            
            if(noRequired.length){
                res.status(400).json({result: false, error: `${noRequired.join(', ')} 값이 없습니다.`})
                return;
            }
          
            const values = await Promise.all(
                Object.entries(req.body).map(async ([key, value]) => key === 'password' ? await bcrypt.hash(value, 12) : value)
            );

            db.query(
                `
                    INSERT INTO users 
                    (${required.join(',')}, created)
                    VALUES (${required.map(()=>'?').join(',')}, NOW())
                `,
                values
                ,
                (error, result)=>{
                    if(error){
                        res.status(400).json({result: false, error: '서버 에러입니다.'})
                        throw error;
                    };
                    res.status(200).json({result: true}).end()
                }
            )
        })
    }catch(err){
        console.error(err);
    }
})

app.post('/signUp/check', (req, res, next)=>{
    console.log(req.body);
    const { type, value } = req.body;
    
    if(!type || !value) res.status(400).send(`${type} 값이 없습니다.`);
    db.query(
        `
            SELECT ${type}
            FROM users
            WHERE ${type} = ?;
        `,
        // req.body.userId,
        value,
        (error, result)=>{
            // console.log(result);
            res.status(200).json({result: !result.length, message: `사용할 수 ${result.length ? '없는' : '있는'} 아이디 입니다` });
        }
    )
    
})

app.use((req, res, next)=>{
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
    error.status = 404;
    next(error);
})


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})

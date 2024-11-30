const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');

const app = express();

dotenv.config();

app.set('port', process.env.PORT || 8001);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/user', (req, res, next)=>{
    console.log(req);
    console.log(res);
})

app.use((req, res, next)=>{
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
    error.status = 404;
    next(error);
})


app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})

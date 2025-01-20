const exporess = require('express');
const { create } = require('../controllers/vipProducts');
const { required } = require('../middlewares');
const imgUpload = require('../uploads');

const router = exporess.Router();

router.post('/create', imgUpload, required, create);

module.exports = router;


const exporess = require('express');
const { create, read } = require('../controllers/vipProducts');
const { required, getFieldsAndValues } = require('../middlewares');
const { imgInfo } = require('../uploads');

const router = exporess.Router();

router.post('/create', imgInfo, required, getFieldsAndValues, create);
router.get('/read', read);

module.exports = router;


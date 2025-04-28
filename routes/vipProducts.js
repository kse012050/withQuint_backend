const exporess = require('express');
const { create, read, detail, update } = require('../controllers/vipProducts');
const { required, getFieldsAndValues, permission } = require('../middlewares');
const { imgInfo } = require('../uploads');

const router = exporess.Router();

router.post('/create', imgInfo, required, getFieldsAndValues, create);
router.get('/read', read);
router.get('/detail', getFieldsAndValues, detail);
router.post('/update', permission, required, getFieldsAndValues, update);

module.exports = router;


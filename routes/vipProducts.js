const exporess = require('express');
const { create, read, detail, update, remove } = require('../controllers/vipProducts');
const { required, getFieldsAndValues } = require('../middlewares');
const { imgInfo } = require('../uploads');
const { isAdminAuth } = require('../controllers/admin');

const router = exporess.Router();

router.get('/', read);
router.post('/create', imgInfo, isAdminAuth, required, getFieldsAndValues, create);
router.get('/detail',isAdminAuth, detail);
router.post('/update', imgInfo, isAdminAuth, required, getFieldsAndValues, update);
router.post('/remove', isAdminAuth, getFieldsAndValues, remove);

module.exports = router;


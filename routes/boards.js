const express = require('express');
const { required, getFieldsAndValues, permission } = require('../middlewares');
const { main, create, read, detail, update, remove } = require('../controllers/boards');
const { imgInfo } = require('../uploads');

const router = express.Router();

router.get('/main', main)

router.get('/', read);
router.post('/create', imgInfo, permission, required, getFieldsAndValues, create);
router.get('/detail', imgInfo, detail)
router.post('/update', imgInfo, permission, required, getFieldsAndValues, update)
router.post('/remove', getFieldsAndValues, remove);

module.exports = router;
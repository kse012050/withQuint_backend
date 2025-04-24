const express = require('express');
const { required, getFieldsAndValues, permission } = require('../middlewares');
const { main, create, read, detail, update, remove } = require('../controllers/boards');
const { imgInfo } = require('../uploads');

const router = express.Router();

router.get('/main', main)

router.get('/', read);
router.post('/create', permission, imgInfo, required, getFieldsAndValues, create);
router.get('/detail', detail)
router.post('/update', permission, required, getFieldsAndValues, update)
router.post('/remove', getFieldsAndValues, remove);

module.exports = router;
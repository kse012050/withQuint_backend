const express = require('express');
const { required, getFieldsAndValues, permissionBoard } = require('../middlewares');
const { main, create, read, detail, update, remove } = require('../controllers/boards');
const { imgInfo } = require('../uploads');
const { isAdminAuth } = require('../controllers/admin');

const router = express.Router();

router.get('/main', main)

router.get('/', read);
router.post('/create', imgInfo, permissionBoard, required, getFieldsAndValues, create);
router.get('/detail', imgInfo, detail)
router.post('/update', imgInfo, permissionBoard, required, getFieldsAndValues, update)
router.post('/remove', isAdminAuth, getFieldsAndValues, remove);

module.exports = router;
const express = require('express');
const { required, getFieldsAndValues } = require('../middlewares');
const { main, create, read, detail } = require('../controllers/boards');
const { imgInfo } = require('../uploads');

const router = express.Router();

router.get('/main', main)

router.get('/', read);
router.post('/create', imgInfo, required, getFieldsAndValues, create);
router.get('/detail', detail)

module.exports = router;
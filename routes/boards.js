const express = require('express');
const { required, getFieldsAndValues } = require('../middlewares');
const { create, read, detail, isIdentity } = require('../controllers/boards');
const { imgInfo } = require('../uploads');

const router = express.Router();

router.get('/', read);
router.post('/create', imgInfo, required, getFieldsAndValues, create);
router.get('/detail', detail)
router.get('/isIdentity', isIdentity, detail)

module.exports = router;
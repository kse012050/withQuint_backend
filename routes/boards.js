const express = require('express');
const { required, getFieldsAndValues } = require('../middlewares');
const { create, read } = require('../controllers/boards');
const { imgInfo } = require('../uploads');

const router = express.Router();

router.get('/', read);
router.post('/create', imgInfo, required, getFieldsAndValues, create);

module.exports = router;
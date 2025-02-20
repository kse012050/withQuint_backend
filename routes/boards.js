const express = require('express');
const { required, getFieldsAndValues } = require('../middlewares');
const { create, boards } = require('../controllers/boards');
const { imgInfo, imgUpload } = require('../uploads');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const router = express.Router();

router.get('/', boards);
router.post('/create', imgInfo, required, getFieldsAndValues, create);

module.exports = router;
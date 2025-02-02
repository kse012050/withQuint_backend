const express = require('express');
const { required, getFieldsAndValues } = require('../middlewares');
const { create, boards } = require('../controllers/boards');

const router = express.Router();

router.get('/', boards);
router.post('/create', required, getFieldsAndValues, create);

module.exports = router;
const express = require('express');
const { required, getFieldsAndValues } = require('../middlewares');
const { create } = require('../controllers/boards');

const router = express.Router();

router.post('/create', required, getFieldsAndValues, create);

module.exports = router;
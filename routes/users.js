const express = require('express');
const { read, detail, update } = require('../controllers/users');
const { isAdminAuth } = require('../controllers/admin');
const { getFieldsAndValues } = require('../middlewares');

const router = express.Router();

router.get('/', isAdminAuth, read);
router.get('/detail', isAdminAuth, detail);
router.post('/update', isAdminAuth, getFieldsAndValues, update);

module.exports = router;
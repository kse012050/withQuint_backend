const express = require('express');
const { read } = require('../controllers/users');
const { isAdminAuth } = require('../controllers/admin');

const router = express.Router();

router.get('/', isAdminAuth, read);

module.exports = router;
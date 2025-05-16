const express = require('express');
const { signUp, check, mobile } = require('../controllers/signUp');
const { required } = require('../middlewares');

const router = express.Router();

router.post('/', required, signUp);
router.post('/check', check);
router.post('/mobile', mobile)

module.exports = router; 
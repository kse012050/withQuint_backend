const express = require('express');
const { signUp, check, mobileAuthSend, isMobileNum, mobileAuthCheck } = require('../controllers/signUp');
const { required } = require('../middlewares');

const router = express.Router();

router.post('/', required, signUp);
router.post('/check', check);
router.post('/mobileAuthSend', isMobileNum, mobileAuthSend)
router.post('/mobileAuthCheck', isMobileNum, mobileAuthCheck)

module.exports = router; 
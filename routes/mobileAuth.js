const express = require('express');
const { mobileAuthSend, mobileAuthCheck, typeResult } = require('../controllers/mobileAuth');
const { isMobile } = require('../controllers/find');

const router = express.Router();

router.post('/send', isMobile, typeResult, mobileAuthSend)
router.post('/check', isMobile, typeResult, mobileAuthCheck)

module.exports = router; 
const express = require('express');
const { isId, isMobile, findId, findPW, pwChange } = require('../controllers/find');

const router = express.Router();

router.post('/id', isMobile, findId)
router.post('/pw', isMobile, findPW)
router.post('/pwChange', pwChange)

module.exports = router;
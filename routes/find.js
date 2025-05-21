const express = require('express');
const { isId, isMobile, findId } = require('../controllers/find');

const router = express.Router();

router.post('/id', isMobile, findId)

module.exports = router;
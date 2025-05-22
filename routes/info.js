const express = require('express');
const { info } = require('../controllers/info');

const router = express.Router();

router.get('/', info);

module.exports = router;
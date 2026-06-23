const express = require('express');
const { info, update } = require('../controllers/info');

const router = express.Router();

router.get('/', info);
router.post('/update', update);

module.exports = router;

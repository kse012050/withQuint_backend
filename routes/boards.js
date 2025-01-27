const express = require('express');
const { required } = require('../middlewares');
const { create } = require('../controllers/boards');

const router = express.Router();

router.post('/create', required, create);

module.exports = router;
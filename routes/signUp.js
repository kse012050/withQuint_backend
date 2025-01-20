const express = require('express');
const { signUp, check } = require('../controllers/signUp');
const { required } = require('../middlewares');

const router = express.Router();

router.post('/', required, signUp);
router.post('/check', check);

module.exports = router; 
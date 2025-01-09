const express = require('express');
const { signIn, auth } = require('../controllers/signIn');

const router = express.Router();

router.post('/', signIn)
router.post('/auth', auth)

module.exports = router;
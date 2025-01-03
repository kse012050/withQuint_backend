const express = require('express');
const { signIn, auth } = require('../controllers/singIn');

const router = express.Router();

router.post('/', signIn)
router.post('/auth', auth)

module.exports = router;
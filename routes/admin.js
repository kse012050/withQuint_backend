const express = require('express');
const { isAdminAuth, logout } = require('../controllers/admin');
const { read } = require('../controllers/boards');
const { auth } = require('../controllers/signIn');

const router = express.Router();

router.get('/auth', isAdminAuth, auth);
router.post('/logout', logout);
router.post('/boards', isAdminAuth, read);

module.exports = router;
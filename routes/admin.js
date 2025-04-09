const express = require('express');
const { isAdminAuth, logout, adminAddField } = require('../controllers/admin');
const { read } = require('../controllers/boards');
const { auth } = require('../controllers/signIn');

const router = express.Router();

router.get('/auth', isAdminAuth, auth);
router.post('/logout', logout);
router.get('/boards', isAdminAuth, adminAddField, read);

module.exports = router;
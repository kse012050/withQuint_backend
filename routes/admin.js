const express = require('express');
const { isAdminAuth, logout, adminAddField } = require('../controllers/admin');
const { read: readBoard } = require('../controllers/boards');
const { auth } = require('../controllers/signIn');
const { read: readVipProducts } = require('../controllers/vipProducts');

const router = express.Router();

router.use(isAdminAuth);

router.get('/auth', auth);
router.post('/logout', logout);
router.get('/boards', adminAddField, readBoard);
router.get('/vipProducts/read', adminAddField, readVipProducts);

module.exports = router;
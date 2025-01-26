const exporess = require('express');
const { create, read } = require('../controllers/vipProducts');
const { required } = require('../middlewares');
const { imgUpload } = require('../uploads');

const router = exporess.Router();

router.post('/create', imgUpload, required, create);
router.get('/read', read);

module.exports = router;


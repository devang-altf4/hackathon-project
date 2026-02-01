const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/buyer/login', authController.loginBuyer);
router.post('/seller/login', authController.loginSeller);
router.post('/waste-worker/login', authController.loginWasteWorker);

module.exports = router;

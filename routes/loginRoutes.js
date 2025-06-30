const express = require('express');
const router = express.Router();
const authController = require('../controllers/loginController');

// Route de login
router.post('/login', authController.login);



module.exports = router;
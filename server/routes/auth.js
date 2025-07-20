const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);

module.exports = router; 
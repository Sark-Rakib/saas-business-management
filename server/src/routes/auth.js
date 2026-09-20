const express = require('express');
const router = express.Router();
const {
  register, login, logout, me, refreshToken, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect, authLimiter } = require('../middleware/auth');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);
router.post('/refresh', authLimiter, refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;

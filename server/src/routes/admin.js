const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.get('/payments', adminController.getPayments);
router.patch('/payments/:id/review', adminController.reviewPayment);
router.get('/subscriptions', adminController.getSubscriptions);

module.exports = router;

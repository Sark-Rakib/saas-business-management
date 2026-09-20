const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

router.use(protect, requireBusiness);
router.get('/', subscriptionController.getSubscription);
router.get('/plans', subscriptionController.getPlans);
router.get('/payment-instructions', subscriptionController.getPaymentInstructions);

module.exports = router;

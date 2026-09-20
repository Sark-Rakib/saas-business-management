const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.use(protect, requireBusiness);
router.get('/', paymentController.getPayments);
router.post('/', paymentController.submitPayment);

module.exports = router;

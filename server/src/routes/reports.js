const express = require('express');
const router = express.Router();
const { protect, requireBusiness, requirePremium } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.use(protect, requireBusiness);

router.get('/pnl', requirePremium, reportController.getPnlReport);
router.get('/sales', requirePremium, reportController.getSalesReport);
router.get('/expenses', requirePremium, reportController.getExpenseReport);
router.get('/investments', requirePremium, reportController.getInvestmentReport);
router.get('/cash-flow', requirePremium, reportController.getCashFlowReport);
router.get('/products', requirePremium, reportController.getProductReport);
router.get('/customers', requirePremium, reportController.getCustomerReport);

module.exports = router;

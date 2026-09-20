const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.use(protect, requireBusiness);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransaction);
router.post('/', transactionController.createTransaction);
router.patch('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;

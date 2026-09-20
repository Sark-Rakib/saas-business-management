const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

router.use(protect, requireBusiness);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpense);
router.post('/', expenseController.createExpense);
router.patch('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

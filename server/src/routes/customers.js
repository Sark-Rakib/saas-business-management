const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const customerController = require('../controllers/customerController');

router.use(protect, requireBusiness);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', customerController.createCustomer);
router.patch('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;

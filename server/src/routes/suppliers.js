const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const supplierController = require('../controllers/supplierController');

router.use(protect, requireBusiness);
router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplier);
router.post('/', supplierController.createSupplier);
router.patch('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
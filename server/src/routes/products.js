const express = require('express');
const router = express.Router();
const { protect, requireBusiness } = require('../middleware/auth');
const productController = require('../controllers/productController');

router.use(protect, requireBusiness);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.patch('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;

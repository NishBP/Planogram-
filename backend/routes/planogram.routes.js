const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

const {
    createPlanogram,
    getPlanogram,
    updateGridSize,
    addProduct,
    updateProduct,
    updateProductPositions,
    deleteProduct,
    updateFacings
} = require('../controllers/planogram.controller');

// === PLANOGRAM ROUTES START ===
// Base routes
router.post('/:categoryId', protect, createPlanogram);
router.get('/:categoryId', protect, getPlanogram);

// Grid management
router.put('/:id/grid', protect, updateGridSize);

// Product management
router.post('/:id/products', protect, addProduct);
router.put('/:id/products/:productId', protect, updateProduct);
router.delete('/:id/products/:productId', protect, deleteProduct);

// Position management
router.put('/:id/products/:productId/positions', protect, updateProductPositions);
router.put('/:id/products/:productId/facings', protect, updateFacings);
// === PLANOGRAM ROUTES END ===

module.exports = router;
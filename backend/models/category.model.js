const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    searchCategories
} = require('../controllers/category.controller');

// Public routes
router.get('/search', searchCategories);

// Protected routes
router.use(protect);

router.route('/')
    .get(getCategories)
    .post(createCategory);

router.route('/:id')
    .get(getCategory)
    .put(updateCategory)
    .delete(deleteCategory);

module.exports = router;
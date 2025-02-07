const Category = require('../models/category.model');
const Planogram = require('../models/planogram.model');

// === HELPER FUNCTIONS START ===
const validateOwnership = async (categoryId, userId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new Error('Category not found');
    }
    if (category.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to access this category');
    }
    return category;
};
// === HELPER FUNCTIONS END ===

// === CRUD OPERATIONS START ===
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }, 
            user: req.user._id 
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.create({
            name,
            user: req.user._id
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ user: req.user._id })
            .select('name lastModified planogramId')
            .sort('-lastModified');

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCategory = async (req, res) => {
    try {
        const category = await validateOwnership(req.params.id, req.user._id);
        
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(error.message === 'Category not found' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        
        await validateOwnership(req.params.id, req.user._id);

        const existingCategory = await Category.findOne({
            _id: { $ne: req.params.id },
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            user: req.user._id
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(error.message === 'Category not found' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await validateOwnership(req.params.id, req.user._id);

        if (category.planogramId) {
            await Planogram.findByIdAndDelete(category.planogramId);
        }

        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(error.message === 'Category not found' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.searchCategories = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search query'
            });
        }

        const categories = await Category.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .select('name')
        .lean();

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// === CRUD OPERATIONS END ===
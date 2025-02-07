const Planogram = require('../models/planogram.model');
const Category = require('../models/category.model');

// === HELPER FUNCTIONS START ===
const validatePlanogramAccess = async (planogramId, userId) => {
    const planogram = await Planogram.findById(planogramId);
    if (!planogram) {
        throw new Error('Planogram not found');
    }
    
    const category = await Category.findById(planogram.categoryId);
    if (category.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to access this planogram');
    }
    
    return planogram;
};
// === HELPER FUNCTIONS END ===

// === PLANOGRAM OPERATIONS START ===
exports.createPlanogram = async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.categoryId,
            user: req.user._id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (category.planogramId) {
            return res.status(400).json({
                success: false,
                message: 'Planogram already exists for this category'
            });
        }

        const planogram = await Planogram.create({
            categoryId: category._id,
            gridSize: req.body.gridSize || { rows: 4, cols: 4 }
        });

        category.planogramId = planogram._id;
        await category.save();

        res.status(201).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getPlanogram = async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.categoryId,
            user: req.user._id
        });

        if (!category || !category.planogramId) {
            return res.status(404).json({
                success: false,
                message: 'Planogram not found'
            });
        }

        const planogram = await Planogram.findById(category.planogramId);
        
        res.status(200).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// === PLANOGRAM OPERATIONS END ===

// === GRID OPERATIONS START ===
exports.updateGridSize = async (req, res) => {
    try {
        const planogram = await validatePlanogramAccess(req.params.id, req.user._id);
        const { rows, cols } = req.body;

        if (!planogram.validateGridResize(rows, cols)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot resize grid: Products would be out of bounds'
            });
        }

        planogram.gridSize = { rows, cols };
        await planogram.save();

        res.status(200).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};
// === GRID OPERATIONS END ===

// === PRODUCT OPERATIONS START ===
exports.addProduct = async (req, res) => {
    try {
        const planogram = await validatePlanogramAccess(req.params.id, req.user._id);
        const { name, mrp, gp, facings, positions } = req.body;

        if (!planogram.validatePositions(null, positions)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid positions provided'
            });
        }

        planogram.products.push({
            name,
            mrp,
            gp,
            facings,
            positions
        });

        await planogram.save();

        res.status(201).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const planogram = await validatePlanogramAccess(req.params.id, req.user._id);
        const { name, mrp, gp } = req.body;

        const product = planogram.products.id(req.params.productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        Object.assign(product, { name, mrp, gp });
        await planogram.save();

        res.status(200).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const planogram = await validatePlanogramAccess(req.params.id, req.user._id);
        
        planogram.products = planogram.products.filter(
            product => product._id.toString() !== req.params.productId
        );
        
        await planogram.save();

        res.status(200).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};
// === PRODUCT OPERATIONS END ===

// === POSITION OPERATIONS START ===
exports.updateProductPositions = async (req, res) => {
    try {
        const planogram = await validatePlanogramAccess(req.params.id, req.user._id);
        const { positions } = req.body;

        const product = planogram.products.id(req.params.productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!planogram.validatePositions(req.params.productId, positions)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid positions provided'
            });
        }

        product.positions = positions;
        await planogram.save();

        res.status(200).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateFacings = async (req, res) => {
    try {
        const planogram = await validatePlanogramAccess(req.params.id, req.user._id);
        const { facings } = req.body;

        const product = planogram.products.id(req.params.productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (facings < product.positions.length) {
            return res.status(400).json({
                success: false,
                message: 'Cannot reduce facings below current position count'
            });
        }

        product.facings = facings;
        await planogram.save();

        res.status(200).json({
            success: true,
            data: planogram
        });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};
// === POSITION OPERATIONS END ===
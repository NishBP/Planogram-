const mongoose = require('mongoose');

// === SCHEMA DEFINITIONS START ===
const positionSchema = new mongoose.Schema({
    row: {
        type: Number,
        required: true,
        min: 0
    },
    col: {
        type: Number,
        required: true,
        min: 0
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    mrp: {
        type: Number,
        required: true,
        min: [0, 'MRP cannot be negative']
    },
    gp: {
        type: Number,
        required: true,
        min: [0, 'GP percentage cannot be negative'],
        max: [100, 'GP percentage cannot exceed 100']
    },
    facings: {
        type: Number,
        required: true,
        min: [1, 'Minimum facing must be 1']
    },
    positions: [positionSchema]
});

const planogramSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    products: [productSchema],
    gridSize: {
        rows: {
            type: Number,
            required: true,
            default: 4,
            min: 2
        },
        cols: {
            type: Number,
            required: true,
            default: 4,
            min: 2
        }
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});
// === SCHEMA DEFINITIONS END ===

// === METHODS START ===
planogramSchema.methods.getMaxOccupiedDimensions = function() {
    let maxRow = 0;
    let maxCol = 0;

    this.products.forEach(product => {
        product.positions.forEach(pos => {
            maxRow = Math.max(maxRow, pos.row);
            maxCol = Math.max(maxCol, pos.col);
        });
    });

    return { maxRow, maxCol };
};

planogramSchema.methods.validateGridResize = function(newRows, newCols) {
    const { maxRow, maxCol } = this.getMaxOccupiedDimensions();
    return newRows > maxRow && newCols > maxCol;
};

planogramSchema.methods.isPositionOccupied = function(row, col, excludeProductId = null) {
    return this.products.some(product => {
        if (excludeProductId && product._id.toString() === excludeProductId.toString()) {
            return false;
        }
        return product.positions.some(pos => pos.row === row && pos.col === col);
    });
};

planogramSchema.methods.validatePositions = function(productId, positions) {
    // Check if positions are within grid bounds
    const validBounds = positions.every(pos => 
        pos.row < this.gridSize.rows && 
        pos.col < this.gridSize.cols
    );
    if (!validBounds) return false;

    // Check if positions are occupied by other products
    return positions.every(pos => 
        !this.isPositionOccupied(pos.row, pos.col, productId)
    );
};
// === METHODS END ===

// === MIDDLEWARE START ===
planogramSchema.pre('save', function(next) {
    if (this.isModified('products') || this.isModified('gridSize')) {
        this.version += 1;
    }
    next();
});
// === MIDDLEWARE END ===

const Planogram = mongoose.model('Planogram', planogramSchema);

module.exports = Planogram;
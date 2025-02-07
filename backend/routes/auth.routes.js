const express = require('express');
const router = express.Router();
const { protect, authorize, loginLimiter, emailVerificationLimiter } = require('../middleware/auth.middleware');

// Import controllers (we'll create these next)
const {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    updatePassword,
    updateProfile
} = require('../controllers/auth.controller');

// === PUBLIC ROUTES START ===
// Authentication routes
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/verify-email/:token', emailVerificationLimiter, verifyEmail);
// === PUBLIC ROUTES END ===

// === PROTECTED ROUTES START ===
// All routes below this middleware are protected
router.use(protect);

// User profile routes
router.get('/me', getMe);
router.put('/update-profile', updateProfile);
router.put('/update-password', updatePassword);
router.post('/logout', logout);
router.post('/resend-verification', emailVerificationLimiter, resendVerificationEmail);
// === PROTECTED ROUTES END ===

// === ADMIN ROUTES START ===
// Admin only routes - add these later if needed
router.use(authorize('admin'));
// Add admin-specific routes here
// === ADMIN ROUTES END ===

module.exports = router;
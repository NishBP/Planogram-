const nodemailer = require('nodemailer');

// === EMAIL CONFIGURATION START ===
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};
// === EMAIL CONFIGURATION END ===

// === EMAIL SENDING FUNCTION START ===
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        // Email template
        const message = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message
        };

        // Add HTML version if provided
        if (options.html) {
            message.html = options.html;
        }

        const info = await transporter.sendMail(message);

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Message sent: %s', info.messageId);
        }

        return info;
    } catch (error) {
        console.error('Email error:', error);
        throw new Error('Email could not be sent');
    }
};
// === EMAIL SENDING FUNCTION END ===

// === HTML EMAIL TEMPLATES START ===
const getVerificationEmailTemplate = (userName, verificationUrl) => {
    return `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2>Verify Your Email</h2>
            <p>Hello ${userName},</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #4A90E2; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email
                </a>
            </div>
            <p>If the button doesn't work, you can also click this link:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
        </div>
    `;
};

const getPasswordResetTemplate = (userName, resetUrl) => {
    return `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2>Reset Your Password</h2>
            <p>Hello ${userName},</p>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #4A90E2; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p>If the button doesn't work, you can also click this link:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 30 minutes.</p>
        </div>
    `;
};
// === HTML EMAIL TEMPLATES END ===

// Export functions
module.exports = {
    sendEmail,
    getVerificationEmailTemplate,
    getPasswordResetTemplate
};
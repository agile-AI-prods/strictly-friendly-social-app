const emailService = require('../services/emailService');

// Verify email with token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        error: 'Verification token is required',
        message: 'Please provide a valid verification token'
      });
    }

    const result = await emailService.verifyEmailToken(token);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email verified successfully! You can now log in to your account.',
        user: {
          id: result.user._id,
          email: result.user.email,
          email_confirmed_at: result.user.email_confirmed_at
        }
      });
    } else {
      res.status(400).json({
        error: 'Verification failed',
        message: result.error || 'Failed to verify email'
      });
    }

  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.message === 'Invalid or expired verification token') {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'The verification link is invalid or has expired. Please request a new verification email.'
      });
    }

    res.status(500).json({
      error: 'Verification failed',
      message: 'An error occurred while verifying your email. Please try again.'
    });
  }
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        message: 'Please provide your email address'
      });
    }

    const db = await require('../config/database').getDatabase();
    const authUsersCollection = db.collection('auth_users');

    // Find user by email
    const user = await authUsersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No account found with this email address'
      });
    }

    // Check if email is already verified
    if (user.email_confirmed_at) {
      return res.status(400).json({
        error: 'Email already verified',
        message: 'This email address is already verified. You can log in to your account.'
      });
    }

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();

    // Update user with new token
    const result = await authUsersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          verification_token: verificationToken,
          verification_token_created_at: new Date(),
          updated_at: new Date()
        } 
      }
    );

    if (!result.acknowledged) {
      throw new Error('Failed to update verification token');
    }

    // Send new verification email
    await emailService.sendVerificationEmail(
      email, 
      user.name || email.split('@')[0], 
      verificationToken
    );

    res.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      error: 'Failed to send verification email',
      message: 'An error occurred while sending the verification email. Please try again.'
    });
  }
};

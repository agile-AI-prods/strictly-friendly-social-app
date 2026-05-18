const authService = require('../services/authService');
const profileService = require('../services/profileService');
const settingsService = require('../services/settingsService');
const recaptchaService = require('../services/recaptchaService');
const deviceManagementService = require('../services/deviceManagementService');

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const isRegistered = await authService.checkEmailExists(email);
      res.json({
        isRegistered,
        message: isRegistered ? 'Email is already registered' : 'Email is available'
      });
    } catch (emailError) {
      // Handle email validation errors
      if (emailError.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          isRegistered: false,
          message: 'Please enter a valid email address'
        });
      }

      // Handle other errors
      console.error('Email check error:', emailError);
      return res.status(500).json({
        error: 'Failed to check email availability',
        isRegistered: false,
        message: 'Unable to verify email availability'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, recaptchaToken } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify reCAPTCHA
    const recaptchaResult = await recaptchaService.verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return res.status(400).json({ error: recaptchaResult.error || 'reCAPTCHA verification failed' });
    }

    try {
      await authService.resetPassword(email);
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (resetError) {
      if (resetError.message === 'Invalid email format') {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please enter a valid email address'
        });
      }

      if (resetError.message === 'Email not found') {
        return res.status(404).json({
          error: 'Email not found',
          message: 'No account found with this email address'
        });
      }

      console.error('Password reset error:', resetError);
      return res.status(500).json({
        error: 'Failed to send password reset email',
        message: 'Unable to process password reset request'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, recaptchaToken, clientIP } = req.body;

    // Verify reCAPTCHA
    const recaptchaResult = await recaptchaService.verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return res.status(400).json({ error: recaptchaResult.error || 'reCAPTCHA verification failed' });
    }

    const { data: session, error } = await authService.login(email, password);
    if (error || !session) {
      return res.status(401).json({ error: error?.message || 'Invalid credentials' });
    }

    // Log session data for debugging
    console.log('=== Login Debug Info ===');
    console.log('session.user.id:', session.user.id);
    console.log('session.user:', JSON.stringify(session.user, null, 2));
    console.log('========================');

    // Set JWT as HTTP-only cookie
    res.cookie('sf_jwt', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    // Fetch user profile first (critical for login response)
    let profile = null;
    try {
      profile = await profileService.getProfile(session.user.id);
      console.log('Profile found by ID:', !!profile);
    } catch (profileError) {
      console.log('Profile not found by ID, trying by email...');
      console.log('Profile error:', profileError.message);
      
      // If profile not found by ID, try to get by email
      try {
        profile = await profileService.getProfileByEmail(email);
        console.log('Profile found by email:', !!profile);
      } catch (emailError) {
        console.log('Profile not found by email either:', emailError.message);
      }
    }

    // If no profile found, create basic user object from session data
    if (!profile) {
      console.log('No profile found, creating basic user object');
      profile = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.email.split('@')[0], // Basic name from email
        created_at: session.user.created_at,
        updated_at: session.user.last_sign_in_at,
        last_sign_in_at: session.user.last_sign_in_at
      };
    }

    // Ensure the profile has the correct id field
    if (profile && !profile.id) {
      profile.id = session.user.id;
    }

    console.log('Final profile to return:', JSON.stringify(profile, null, 2));

    // Send login response immediately
    res.json({ user: profile });

    // Record device login information asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        await deviceManagementService.recordDeviceLogin(req, email, clientIP);
      } catch (deviceError) {
        console.error('Error recording device login:', deviceError);
        // Don't fail the login process if device recording fails
      }
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, password, name, recaptchaToken } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify reCAPTCHA
    const recaptchaResult = await recaptchaService.verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return res.status(400).json({ error: recaptchaResult.error || 'reCAPTCHA verification failed' });
    }

    // Try to check if email is already registered (but don't fail if check fails)
    let isRegistered = false;
    try {
      isRegistered = await authService.checkEmailExists(email);
    } catch (checkError) {
      console.log('Email check failed, proceeding with signup:', checkError);
      // Continue with signup even if email check fails
    }

    if (isRegistered) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Create user account
    const { data, error } = await authService.signup(email, password, { name });

    if (error) {
      // Check if the error is due to email already being registered
      if (error.message.includes('already registered') ||
        error.message.includes('already exists') ||
        error.message.includes('already been registered')) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Return success response
    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: data.user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Email, password and confirmation are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
      const { data, error } = await authService.updatePassword(email, password);
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update password',
        message: 'Unable to update password. Please try again.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('sf_jwt');
  res.json({ success: true });
};

exports.updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const userId = req.user.sub; // Get user ID from JWT token
    const oldEmail = req.user.email; // Get current email from JWT token

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }

    // Validate email format
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // First, verify the current password by attempting to sign in
    try {
      const { data: session, error: signInError } = await authService.login(oldEmail, currentPassword);
      if (signInError || !session) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } catch (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update the email in auth, profiles, and settings tables
    try {
      // Update email in Supabase Auth
      console.log(`Updating auth table for user ${userId} with new email: ${newEmail}`);
      const { data, error } = await authService.updateEmail(userId, newEmail, currentPassword);
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      console.log('Auth table update successful:', data);

      // Update email in profiles table
      try {
        console.log(`Updating profiles table for user ${userId} with new email: ${newEmail}`);
        console.log('Profile update parameters:', { id: userId, updates: { email: newEmail } });

        const profileUpdateResult = await profileService.updateProfile(userId, { email: newEmail });
        console.log('Profile update successful:', profileUpdateResult);
      } catch (profileError) {
        console.error('Profile update error:', profileError);
        // Log the specific error details
        console.error('Profile update failed for user:', userId);
        console.error('New email:', newEmail);
        console.error('Error message:', profileError.message);
        console.error('Error stack:', profileError.stack);

        // Return error response since profile update failed
        return res.status(500).json({
          error: 'Email updated in auth but failed to update in profiles table',
          message: 'Email was updated but there was an issue updating your profile. Please contact support.',
          details: profileError.message
        });
      }

      // Update email in settings table
      try {
        console.log(`Updating settings table from ${oldEmail} to ${newEmail}`);
        const settingsUpdateResult = await settingsService.updateSettingsEmail(oldEmail, newEmail);
        if (settingsUpdateResult) {
          console.log('Settings table update successful:', settingsUpdateResult);
        } else {
          console.log('No settings found for old email, skipping settings update');
        }
      } catch (settingsError) {
        console.error('Settings update error:', settingsError);
        // Log the error but don't fail the entire operation since settings are optional
        console.error('Settings update failed for user:', userId);
        console.error('Old email:', oldEmail);
        console.error('New email:', newEmail);
        console.error('Error message:', settingsError.message);
        console.error('Error stack:', settingsError.stack);
        // Continue with the operation since settings update failure shouldn't block email change
      }

      res.json({
        success: true,
        message: 'Email updated successfully in auth, profiles, and settings',
        user: data.user
      });
    } catch (updateError) {
      console.error('Email update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update email',
        message: updateError.message || 'Unable to update email. Please try again.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body;
    const userId = req.user.sub; // Get user ID from JWT token

    if (!newPassword || !currentPassword) {
      return res.status(400).json({ error: 'New password and current password are required' });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // First, verify the current password by attempting to sign in
    try {
      const { data: session, error: signInError } = await authService.login(req.user.email, currentPassword);
      if (signInError || !session) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } catch (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update the password in Supabase Auth
    try {
      console.log(`Updating password for user ${userId}`);
      const { data, error } = await authService.updatePasswordById(userId, newPassword);
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      console.log('Password update successful:', data);

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update password',
        message: updateError.message || 'Unable to update password. Please try again.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 
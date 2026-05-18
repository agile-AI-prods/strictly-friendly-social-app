const { getDatabase } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.login = async (email, password) => {
  try {
    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');
    
    // Find user by email
    const user = await authUsersCollection.findOne({ email });
    
    if (!user) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
    
    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      return { data: null, error: { message: 'Please confirm your email before logging in' } };
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }
    
    // Update last sign in time
    await authUsersCollection.updateOne(
      { _id: user._id },
      { $set: { last_sign_in_at: new Date() } }
    );
    
    // Create session data
    const session = {
      user: {
        id: user._id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: new Date()
      },
      access_token: jwt.sign(
        { 
          sub: user._id, 
          email: user.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
        },
        process.env.JWT_SECRET || 'your-secret-key'
      )
    };
    
    return { data: session, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { data: null, error: { message: 'Login failed' } };
  }
};

exports.checkEmailExists = async (email) => {
  // First validate email format
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');
    
    // Check if email exists in MongoDB
    const userExists = await authUsersCollection.findOne({ email });
    return !!userExists;
  } catch (err) {
    console.error('Error in checkEmailExists:', err);
    throw err;
  }
};

exports.signup = async (email, password, metadata = {}) => {
  try {
    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');
    const profilesCollection = db.collection('profiles');
    const { UUID } = require('mongodb');

    // Check if email already exists in both collections
    const existingAuthUser = await authUsersCollection.findOne({ email });
    const existingProfile = await profilesCollection.findOne({ email });
    
    if (existingAuthUser || existingProfile) {
      return { data: null, error: { message: 'Email is already registered' } };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user ID
    const userId = new UUID();

    // Generate verification token
    const verificationToken = emailService.generateVerificationToken();
    
    // Create user in auth_users collection
    const userData = {
      _id: userId,
      email: email,
      password: hashedPassword,
      email_confirmed_at: null, // Not confirmed until email verification
      verification_token: verificationToken,
      verification_token_created_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      last_sign_in_at: null,
      role: 'user'
    };

    const authResult = await authUsersCollection.insertOne(userData);

    if (!authResult.acknowledged) {
      throw new Error('Failed to create user account');
    }

    // Create profile in profiles collection
    const profileData = {
      _id: userId,
      email: email,
      name: metadata.name || email.split('@')[0],
      created_at: new Date(),
      updated_at: new Date(),
      is_online: false,
      role: 'user'
    };

    try {
      const profileResult = await profilesCollection.insertOne(profileData);

      if (!profileResult.acknowledged) {
        // If profile creation fails, clean up the auth user
        await authUsersCollection.deleteOne({ _id: userId });
        throw new Error('Failed to create user profile');
      }
    } catch (profileError) {
      // If profile creation fails due to duplicate key, clean up the auth user
      if (profileError.code === 11000) {
        await authUsersCollection.deleteOne({ _id: userId });
        return { data: null, error: { message: 'Email is already registered' } };
      }
      // Clean up auth user for other profile errors
      await authUsersCollection.deleteOne({ _id: userId });
      throw profileError;
    }

    // Create default settings
    try {
      const settingsService = require('./settingsService');
      await settingsService.createDefaultSettings(email);
    } catch (settingsError) {
      console.log('Failed to create default settings:', settingsError);
      // Don't fail signup if settings creation fails
    }

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        email, 
        metadata.name || email.split('@')[0], 
        verificationToken
      );
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail signup if email sending fails, but log it
      // User can request resend later
    }

    // Return success response
    return {
      data: {
        user: {
          id: userId,
          email: email,
          name: metadata.name || email.split('@')[0],
          created_at: userData.created_at,
          email_confirmed_at: userData.email_confirmed_at
        }
      },
      error: null
    };
  } catch (error) {
    console.error('Signup error:', error);
    return { data: null, error: { message: error.message || 'Signup failed' } };
  }
};

exports.resetPassword = async (email) => {
  // First validate email format
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Check if email exists in MongoDB
  const emailExists = await exports.checkEmailExists(email);
  if (!emailExists) {
    throw new Error('Email not found');
  }

  // For now, just return success (email functionality can be implemented later)
  // In a production environment, you would send a password reset email
  console.log(`Password reset requested for email: ${email}`);
  
  return { success: true, message: 'Password reset email sent successfully' };
};
exports.updatePassword = async (email, newPassword) => {
  try {
    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');

    // Find user by email
    const user = await authUsersCollection.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = await authUsersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password_hash: hashedPassword,
          updated_at: new Date()
        } 
      }
    );

    if (!result.acknowledged) {
      throw new Error('Failed to update password');
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    throw error;
  }
};

exports.updatePasswordById = async (userId, newPassword) => {
  try {
    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');
    const { UUID } = require('mongodb');

    // Convert userId to UUID if it's a string
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }

    // Find user by ID
    const user = await authUsersCollection.findOne({ _id: userIdUUID });
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = await authUsersCollection.updateOne(
      { _id: userIdUUID },
      { 
        $set: { 
          password: hashedPassword,
          updated_at: new Date()
        } 
      }
    );

    if (!result.acknowledged) {
      throw new Error('Failed to update password');
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    throw error;
  }
 };

exports.updateEmail = async (userId, newEmail, currentPassword) => {
  try {
    // First validate email format
    if (!isValidEmail(newEmail)) {
      throw new Error('Invalid email format');
    }

    // Check if the new email is already in use
    const emailExists = await exports.checkEmailExists(newEmail);
    if (emailExists) {
      throw new Error('Email is already in use');
    }

    const db = await getDatabase();
    const authUsersCollection = db.collection('auth_users');
    const profilesCollection = db.collection('profiles');
    const { UUID } = require('mongodb');

    // Convert userId to UUID if it's a string
    let userIdUUID;
    try {
      userIdUUID = new UUID(userId);
    } catch (uuidError) {
      userIdUUID = userId;
    }

    // Get the user by ID
    const user = await authUsersCollection.findOne({ _id: userIdUUID });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Update email in auth_users collection
    const authResult = await authUsersCollection.updateOne(
      { _id: userIdUUID },
      { 
        $set: { 
          email: newEmail,
          updated_at: new Date()
        } 
      }
    );

    if (!authResult.acknowledged) {
      throw new Error('Failed to update email in auth collection');
    }

    // Update email in profiles collection
    const profileResult = await profilesCollection.updateOne(
      { _id: userIdUUID },
      { 
        $set: { 
          email: newEmail,
          updated_at: new Date()
        } 
      }
    );

    if (!profileResult.acknowledged) {
      throw new Error('Failed to update email in profiles collection');
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    throw error;
  }
}; 
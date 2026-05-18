const crypto = require('crypto');

// Mailtrap HTTP API configuration
const MAILTRAP_CONFIG = {
  apiUrl: 'https://send.api.mailtrap.io/api/send',
  apiToken: '0692466b7ac40ef34eb2fa050cd2892e'
};

// Generate verification token
exports.generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email via Mailtrap HTTP API
exports.sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/verify?token=${verificationToken}`;
    
    console.log('📧 Sending verification email via Mailtrap HTTP API');
    console.log('📨 To:', email);
    console.log('👤 Name:', name);
    console.log('🔗 Verification URL:', verificationUrl);
    
    const emailData = {
      from: {
        email: 'hello@demomailtrap.co', // Demo domain that works
        name: 'Strictly Friendly'
      },
      to: [
        {
          email: "wintershine1030@gmail.com",
          name: name
        }
      ],
      subject: 'Verify Your Email - Strictly Friendly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification - Strictly Friendly</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 30px;
                    text-align: center;
                    color: white;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .header p {
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                }
                .content {
                    padding: 40px 30px;
                    background-color: #f8f9fa;
                }
                .welcome-text {
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }
                .button-container {
                    text-align: center;
                    margin: 35px 0;
                }
                .verify-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 18px 35px;
                    text-decoration: none;
                    border-radius: 30px;
                    font-size: 16px;
                    font-weight: 600;
                    display: inline-block;
                    transition: transform 0.2s ease;
                }
                .verify-button:hover {
                    transform: translateY(-2px);
                }
                .link-text {
                    font-size: 14px;
                    color: #666;
                    margin-top: 25px;
                    text-align: center;
                }
                .url-text {
                    font-size: 12px;
                    color: #999;
                    word-break: break-all;
                    background-color: #f1f1f1;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    text-align: center;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                }
                .footer p {
                    font-size: 12px;
                    color: #999;
                    margin: 0;
                }
                .highlight {
                    color: #667eea;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Strictly Friendly!</h1>
                    <p>Hi ${name}, please verify your email address</p>
                </div>
                
                <div class="content">
                    <div class="welcome-text">
                        Thank you for signing up! To complete your registration and start connecting with new friends, please click the button below to verify your email address.
                    </div>
                    
                    <div class="button-container">
                        <a href="${verificationUrl}" class="verify-button">
                            Verify Email Address
                        </div>
                    
                    <div class="link-text">
                        If the button doesn't work, you can copy and paste this link into your browser:
                    </div>
                    
                    <div class="url-text">
                        ${verificationUrl}
                    </div>
                    
                    <div class="footer">
                        <p>This email was sent to <span class="highlight">${email}</span></p>
                        <p>If you didn't sign up for Strictly Friendly, you can safely ignore this email.</p>
                        <p>This verification link will expire in 24 hours.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `
    };
    
    // Send email via Mailtrap HTTP API
    const response = await fetch(MAILTRAP_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILTRAP_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Verification email sent successfully via Mailtrap HTTP API');
      console.log('📧 Mailtrap Response:', result);
      return { success: true, messageId: result.message_ids[0] };
    } else {
      const errorText = await response.text();
      console.error('❌ Mailtrap HTTP API failed:', response.status, errorText);
      throw new Error(`Mailtrap HTTP API failed: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error sending verification email via Mailtrap HTTP API:', error);
    throw new Error('Failed to send verification email');
  }
};

// Verify email token
exports.verifyEmailToken = async (token) => {
  try {
    const db = await require('../config/database').getDatabase();
    const authUsersCollection = db.collection('auth_users');
    
    // Find user with this verification token
    const user = await authUsersCollection.findOne({ 
      verification_token: token,
      email_confirmed_at: null // Only unverified users
    });
    
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }
    
    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - user.verification_token_created_at.getTime();
    const tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (tokenAge > tokenExpiry) {
      throw new Error('Verification token has expired');
    }
    
                    // Mark email as verified
                const result = await authUsersCollection.updateOne(
                  { _id: user._id },
                  { 
                    $set: { 
                      email_confirmed_at: new Date(),
                      updated_at: new Date()
                    },
                    $unset: { 
                      verification_token: "",
                      verification_token_created_at: ""
                    }
                  }
                );

                if (!result.acknowledged) {
                  throw new Error('Failed to verify email');
                }

                console.log('✅ Email verification successful for user:', user.email);
                console.log('✅ User _id:', user._id);
                console.log('✅ email_confirmed_at set to:', new Date());

                return { success: true, user: user };
    
  } catch (error) {
    console.error('Error verifying email token:', error);
    throw error;
  }
};







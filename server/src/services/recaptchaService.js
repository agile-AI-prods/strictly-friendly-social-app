const axios = require('axios');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY 
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

exports.verifyRecaptcha = async (recaptchaToken) => {
  try {
    // Skip reCAPTCHA verification in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('reCAPTCHA verification skipped in development mode');
      return { success: true, score: 1.0, action: 'development' };
    }
    
    if (!recaptchaToken) {
      return { success: false, error: 'reCAPTCHA token is required' };
    }

    const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
      params: {
        secret: RECAPTCHA_SECRET_KEY,
        response: recaptchaToken
      }
    });

    const { success, score, action } = response.data;

    if (!success) {
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    // For reCAPTCHA v2, success is true if the user completed the challenge
    // For reCAPTCHA v3, you might want to check the score (0.0 to 1.0)
    return { success: true, score, action };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'reCAPTCHA verification error' };
  }
}; 
 
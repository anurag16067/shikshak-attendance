const twilio = require('twilio');

let client = null;

// Only initialize Twilio if valid credentials are provided
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid' &&
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token') {
  try {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS service initialized');
  } catch (error) {
    console.log('⚠️  Twilio initialization failed, SMS will be disabled');
  }
} else {
  console.log('ℹ️  Twilio credentials not configured, SMS will be disabled');
}

const sendSMS = async (to, message) => {
  try {
    if (!client) {
      console.log('📱 SMS (Mock): Would send to', to, 'Message:', message);
      return { success: true, mock: true };
    }
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log('📱 SMS sent successfully to', to);
    return result;
  } catch (error) {
    console.error('❌ SMS sending error:', error.message);
    // Return mock success for development
    return { success: false, error: error.message, mock: true };
  }
};

module.exports = {
  client,
  sendSMS
}; 
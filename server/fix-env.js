const fs = require('fs');

const envContent = `# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://anurag16067:XuYsst77AneII0JX@clusterone.g5qxa5f.mongodb.net/shikshak_watch?retryWrites=true&w=majority

# JWT Secret (generated securely)
JWT_SECRET=cdde3384507d624c03dbec1d21d5766e6670deb2080a9afd051b68a8a416a4c93566bb5f9c0f13be03b720aa251f6cca2e7c18392fb1cd192b48e2b9cdeaaa0b

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=daluuwfv9
CLOUDINARY_API_KEY=917884364838526
CLOUDINARY_API_SECRET=j8H484wKd9dcc1VvMGV_8ncDoYE

# Twilio Configuration (for SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file fixed successfully!');
console.log('MONGODB_URI is now properly set.'); 
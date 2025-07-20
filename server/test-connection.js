const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('📡 Connecting to: ' + process.env.MONGODB_URI.split('@')[1].split('/')[0]);
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database: shikshak_watch');
    console.log('🌐 Cluster: MongoDB Atlas');
    console.log('🔗 Status: Connected and ready');
    console.log('');
    console.log('🎉 Your backend is ready to run!');
    console.log('🚀 Start the server with: npm run dev');
    
    await mongoose.disconnect();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your .env file has MONGODB_URI');
    console.log('   2. Verify MongoDB Atlas connection string');
    console.log('   3. Check internet connection');
    console.log('   4. Ensure MongoDB Atlas cluster is running');
  }
}

testConnection(); 
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const schoolRoutes = require('./routes/school');
const reportRoutes = require('./routes/report');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('📊 Database: shikshak_watch');
  console.log('🌐 Cluster: MongoDB Atlas');
  console.log('🔗 Connection: ' + process.env.MONGODB_URI.split('@')[1].split('/')[0]);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.log('🔧 Please check your .env file and MongoDB Atlas connection');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shikshak Watch API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Local URL: http://localhost:${PORT}`);
  console.log(`📱 Network URL: http://YOUR_IP_ADDRESS:${PORT}`);
  console.log(`💡 Replace YOUR_IP_ADDRESS with your computer's IP address`);
}); 
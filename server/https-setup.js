const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

// Create a simple self-signed certificate for development
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

const app = express();

// Middleware
app.use(require('cors')());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const schoolRoutes = require('./routes/school');
const reportRoutes = require('./routes/report');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Shikshak Watch API is running (HTTPS)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Create HTTPS server
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTPS Server running on port ${PORT}`);
  console.log(`📱 Local URL: https://localhost:${PORT}`);
  console.log(`📱 Network URL: https://YOUR_IP_ADDRESS:${PORT}`);
  console.log(`💡 Replace YOUR_IP_ADDRESS with your computer's IP address`);
}); 
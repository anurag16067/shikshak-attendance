# 🚀 Shikshak Watch - Setup Guide

## 📋 Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

## 🔧 Environment Setup

### 1. MongoDB Atlas Setup

#### Step 1: Create MongoDB Atlas Account
1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project

#### Step 2: Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider and region
4. Click "Create"

#### Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

#### Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

#### Step 5: Get Connection String
1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string

### 2. Cloudinary Setup

#### Step 1: Create Cloudinary Account
1. Visit [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

#### Step 2: Get Your Credentials
1. Go to your Dashboard
2. Note down:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Create Environment File

Create a file named `.env` in the `server/` directory with the following content:

```env
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/shikshak_watch?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio Configuration (Optional - for SMS alerts)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Replace Placeholder Values

#### MongoDB URI
Replace the connection string with your actual MongoDB Atlas URI:
- Replace `your_username` with your database username
- Replace `your_password` with your database password
- Replace `your_cluster` with your actual cluster name

#### JWT Secret
Generate a strong random string for JWT_SECRET. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Cloudinary Credentials
Replace with your actual Cloudinary credentials:
- `your_cloudinary_cloud_name`
- `your_cloudinary_api_key`
- `your_cloudinary_api_secret`

## 🚀 Running the Application

### 1. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Start the Backend
```bash
cd server
npm run dev
```

### 3. Start the Frontend
```bash
cd client
npm start
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📝 Testing the Setup

### 1. Test MongoDB Connection
The backend will show "✅ MongoDB connected successfully" if the connection is working.

### 2. Test Cloudinary
Try uploading a photo during teacher check-in. If it works, Cloudinary is properly configured.

### 3. Test JWT Authentication
Try logging in with a test user. If you get a token, JWT is working.

## 🔒 Security Notes

1. **Never commit your .env file** - it's already in .gitignore
2. **Use strong passwords** for database users
3. **Generate a strong JWT secret** - don't use the example
4. **Restrict network access** in production

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Check if your IP is whitelisted in Atlas
- Verify username/password in connection string
- Ensure cluster is running

### Cloudinary Issues
- Verify API key and secret are correct
- Check if your account is active
- Ensure you're not exceeding free tier limits

### JWT Issues
- Make sure JWT_SECRET is set
- Check if token is being sent in Authorization header

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check if ports 3000 and 5000 are available 
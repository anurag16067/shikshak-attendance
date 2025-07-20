# 📱 Access Shikshak Watch on Your Phone

## 🚀 Quick Setup Guide

### Step 1: Find Your Computer's IP Address

**On Windows:**
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" (usually 192.168.x.x)

**Example:**
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### Step 2: Update API Configuration

1. **Edit:** `client/src/config/api.js`
2. **Replace:** `192.168.1.100` with your actual IP address
3. **Save the file**

```javascript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000';
```

### Step 3: Start Your Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

### Step 4: Access on Phone

1. **Make sure your phone is on the same WiFi network as your computer**
2. **Open browser on phone**
3. **Go to:** `http://YOUR_IP_ADDRESS:3000`

**Example:** `http://192.168.1.100:3000`

## 🔧 Troubleshooting

### If it doesn't work:

1. **Check Windows Firewall:**
   - Allow Node.js through firewall
   - Allow ports 3000 and 5000

2. **Check Router Settings:**
   - Make sure devices are on same network
   - No network isolation enabled

3. **Try different browsers:**
   - Chrome, Safari, Firefox

## 📱 Benefits of Phone Testing

- ✅ **Real GPS accuracy** (±5-20m vs ±221km on laptop)
- ✅ **Real camera functionality**
- ✅ **Touch interface testing**
- ✅ **Real-world usage simulation**

## 🎯 Next Steps

1. **Update the IP address in config**
2. **Restart both servers**
3. **Access on phone**
4. **Test teacher attendance with real GPS!**

Your phone will have much better GPS accuracy for testing! 🚀 
# 🔒 Secure Tunnel Audio Streaming Setup

Stream your audio files directly from your computer to students over the internet without uploading files anywhere!

## 🎯 How It Works

```
Your Computer → Local Server → Secure Tunnel → Internet → Students
     ↑              ↑              ↑           ↑           ↑
Audio Files    Node.js Server   ngrok/CF   GitHub Pages   Web Player
(Stay Local)   (Authentication)  (Tunnel)   (Interface)   (Stream Audio)
```

**Benefits:**
- ✅ **Audio files never leave your computer**
- ✅ **Complete control** - start/stop anytime
- ✅ **Secure authentication** - only authorized students
- ✅ **Scheduled access** - classes only available at set times
- ✅ **Real-time streaming** - students can't download files

---

## 📋 Prerequisites

### 1. Install Node.js
```bash
# Download and install from: https://nodejs.org/
# Verify installation:
node --version
npm --version
```

### 2. Install Tunnel Service

#### Option A: ngrok (Recommended)
```bash
# Download from: https://ngrok.com/download
# Or install via package manager:

# macOS (Homebrew)
brew install ngrok/ngrok/ngrok

# Windows (Chocolatey)
choco install ngrok

# Verify installation
ngrok --version
```

#### Option B: Cloudflare Tunnel (Alternative)
```bash
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation

# macOS
brew install cloudflare/cloudflare/cloudflared

# Verify installation
cloudflared --version
```

---

## 🚀 Quick Start

### Step 1: Prepare Your Audio Files
```bash
cd /Users/shivin/Desktop/agora-app-builder/scheduled-audio-player

# Make sure your audio files are in the audio/ directory:
ls audio/
# Should show your MP3 files:
# Hare Krsna Kirtana.mp3
# 74. Elements of Akarma 1 (29.11.20).mp3
```

### Step 2: Start the Streaming Service
```bash
# Simple start (uses ngrok)
node start-streaming.js

# Or with options
node start-streaming.js --cloudflare
node start-streaming.js --port 8080 --max-streams 100
```

### Step 3: Get Your Tunnel URL
The script will output something like:
```
✅ SUCCESS! Audio streaming service is ready!
============================================

🌐 Your students can access classes at:
   https://abc123.ngrok.io

📊 Service Information:
   • Local Server: http://localhost:3000
   • Tunnel URL: https://abc123.ngrok.io
   • Audio Directory: /path/to/audio
```

### Step 4: Update Your Web Player
The tunnel URL is automatically saved to `tunnel-url.js`. Your GitHub Pages site will automatically use this tunnel for audio streaming.

---

## ⚙️ Configuration Options

### Basic Usage
```bash
# Default settings (ngrok, port 3000)
node start-streaming.js

# Use Cloudflare tunnel instead
node start-streaming.js --cloudflare

# Custom port
node start-streaming.js --port 8080

# Maximum concurrent streams
node start-streaming.js --max-streams 100

# Custom audio directory
node start-streaming.js --audio-dir /path/to/my/audio
```

### Advanced Configuration

#### Ngrok with Custom Subdomain
```bash
# 1. Get ngrok auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

# 2. Set environment variables
export NGROK_AUTH_TOKEN=2yzraYFA58F8FbR5LlcgZ4ofZXj_7moVc4LaTSuRev7uFBdtR
export NGROK_SUBDOMAIN="kirtana-classes"

# 3. Start with custom subdomain
node start-streaming.js

# Your URL will be: https://kirtana-classes.ngrok.io
```

#### Environment Variables
```bash
# Create .env file (optional)
NGROK_AUTH_TOKEN=2yzraYFA58F8FbR5LlcgZ4ofZXj_7moVc4LaTSuRev7uFBdtR
NGROK_SUBDOMAIN=kirtana-classes
PORT=3000
MAX_STREAMS=50
TOKEN_EXPIRY_MINUTES=60
```

---

## 🔧 Command Reference

### Start Streaming Service
```bash
node start-streaming.js [options]

Options:
  --port <number>          Local server port (default: 3000)
  --cloudflare            Use Cloudflare tunnel
  --ngrok                 Use ngrok tunnel (default)
  --auth-token <token>    Ngrok auth token
  --subdomain <name>      Custom subdomain for ngrok
  --audio-dir <path>      Audio files directory
  --max-streams <number>  Max concurrent streams (default: 50)
  --token-expiry <mins>   Token expiry in minutes (default: 60)
  --help                  Show help
```

### Individual Components
```bash
# Start only local server
node local-server.js

# Start only tunnel
node tunnel-setup.js start
node tunnel-setup.js stop
node tunnel-setup.js status

# Test tunnel connection
node tunnel-setup.js test
```

---

## 🔒 Security Features

### Authentication System
- **Secure tokens** generated for each student/class
- **Time-limited access** (tokens expire after set time)
- **Class-specific permissions** (token only works for assigned class)
- **Rate limiting** (max concurrent streams)

### Audio Protection
- **No direct file access** - students can't browse your file system
- **Streaming only** - files are not downloadable
- **Automatic cleanup** - expired tokens are removed
- **Connection monitoring** - track active streams

### Network Security
- **HTTPS encryption** via tunnel service
- **CORS protection** for web security
- **Request validation** and sanitization
- **Error handling** without information leakage

---

## 📊 Monitoring & Management

### Real-time Status
While streaming service is running, you'll see:
```
📊 2 active stream(s), 5 authorized tokens
🔄 Checking tunnel connection...
✅ Tunnel healthy
```

### Health Monitoring
- **Automatic tunnel reconnection** if disconnected
- **Token cleanup** for expired authentication
- **Stream tracking** with connection monitoring
- **Error logging** for troubleshooting

---

## 🚨 Troubleshooting

### Common Issues

#### "ngrok not found" Error
```bash
# Install ngrok
brew install ngrok/ngrok/ngrok  # macOS
# or download from https://ngrok.com/download

# Verify installation
ngrok --version
```

#### "Authentication failed" Error
```bash
# Get auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Or set environment variable
export NGROK_AUTH_TOKEN="your_token_here"
```

#### "Tunnel startup timeout" Error
```bash
# Check your internet connection
# Try cloudflare instead
node start-streaming.js --cloudflare

# Or try different port
node start-streaming.js --port 8080
```

#### Audio Files Not Found
```bash
# Check audio directory
ls audio/

# Make sure file names match config.js exactly
# File names are case-sensitive!

# Update config.js if needed:
audioFile: 'Hare Krsna Kirtana.mp3'  # Exact filename
```

### Network Issues

#### Students Can't Access Tunnel
1. **Check tunnel status**: Look for tunnel URL in console output
2. **Test tunnel**: Visit the health endpoint: `https://your-tunnel.ngrok.io/health`
3. **Firewall**: Make sure your computer allows Node.js network access
4. **Restart tunnel**: Press Ctrl+C and restart the service

#### Audio Won't Load for Students
1. **Check authentication**: Look for "Authentication successful" in logs
2. **Token expiry**: Tokens expire after 60 minutes by default
3. **File path**: Ensure audio file exists and filename matches exactly
4. **Browser console**: Students should check browser console for errors

---

## 📝 Production Tips

### For Regular Classes
1. **Create a startup script**:
```bash
#!/bin/bash
# start-kirtana.sh
cd /path/to/audio-player
export NGROK_SUBDOMAIN="kirtana-classes"
node start-streaming.js
```

2. **Schedule classes in advance** by updating `config.js`
3. **Start streaming 10-15 minutes before class** to ensure everything works
4. **Share your tunnel URL** with students ahead of time

### For Multiple Classes
- **Keep the same tunnel running** for consistency
- **Update class schedule** in `config.js` as needed
- **Monitor active streams** during peak times
- **Adjust max streams** based on your internet bandwidth

### Bandwidth Considerations
- **MP3 files**: ~1-2 MB per minute of audio
- **50 concurrent students**: ~50-100 Mbps upload needed
- **Reduce max streams** if you have limited upload bandwidth
- **Compress audio files** if needed (lower bitrate)

---

## 🎵 Ready to Stream!

Your secure tunnel audio streaming system is now ready. Students will be able to:

1. **Visit your GitHub Pages website** (class list interface)
2. **Select and join available classes** with real-time countdowns
3. **Stream audio directly from your computer** without downloading
4. **Access classes only during scheduled times** with automatic authentication

**Start your first streaming session:**
```bash
node start-streaming.js
```

🙏 Perfect for Kirtana sessions, spiritual discourses, and educational audio content!
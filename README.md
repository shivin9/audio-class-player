# Scheduled Audio Player with Auto-Deploy

A secure audio streaming system that automatically updates GitHub Pages with the latest tunnel URL.

## 🚀 Quick Start

### One-Command Setup
```bash
node auto-deploy.js
```

This will:
1. ✅ Start your local audio server
2. ✅ Create ngrok tunnel with random URL  
3. ✅ Update config files with new tunnel URL
4. ✅ Auto-commit and push to GitHub
5. ✅ Students get latest URL from GitHub Pages

### What Students See
- Visit: `https://your-username.github.io/your-repo/`
- Always get the current tunnel URL automatically
- No manual updates needed!

## 📁 File Structure

```
scheduled-audio-player/
├── audio/                  # Your audio files (not uploaded to GitHub)
├── index.html             # Main web interface
├── config.js              # Class schedules and settings
├── tunnel-url.js          # Auto-updated tunnel URL (pushed to GitHub)
├── auto-deploy.js         # 🎯 Main script - run this!
├── local-server.js        # Audio streaming server
└── start-streaming.js     # Manual alternative
```

## 🎵 Adding Audio Classes

Edit `config.js`:
```javascript
schedule: [
    {
        id: 'my-class',
        title: 'My Audio Class',
        description: 'Class description',
        startTime: '2024-01-20T10:00:00',
        endTime: '2024-01-20T11:00:00',
        audioFile: 'my-audio.mp3',  // Place in /audio folder
        timezone: 'America/New_York'
    }
]
```

## 🔧 Requirements

- **Node.js** - For running the server
- **ngrok** - For tunneling (free version works!)
- **Git repository** - Connected to GitHub
- **GitHub Pages** - Enabled for your repo

### Install ngrok
```bash
# Download from https://ngrok.com/download
# Or use package managers:
npm install -g ngrok
# or
brew install ngrok
```

## 🔄 Workflow

1. **You run**: `node auto-deploy.js` 
2. **System does**:
   - Starts audio server on localhost:3000
   - Creates tunnel like `https://abc123.ngrok-free.app`
   - Updates `tunnel-url.js` with new URL
   - Commits & pushes to GitHub
3. **Students visit**: Your GitHub Pages URL
4. **They get**: Latest tunnel URL automatically!

## 🛡️ Security Features

- ✅ Audio files never uploaded to GitHub
- ✅ Token-based authentication
- ✅ Time-based access control
- ✅ Anti-download protection
- ✅ No direct file access

## 🎯 Usage Examples

### Start streaming for today's class:
```bash
node auto-deploy.js
```

### Manual alternative (no auto-deploy):
```bash
node start-streaming.js
```

### Check if Git is ready:
```bash
git status
git remote -v  # Should show your GitHub repo
```

## 📱 GitHub Pages Setup

1. Go to your repo → Settings → Pages
2. Source: Deploy from a branch
3. Branch: main (or master)
4. Folder: / (root)
5. Save

Your site will be at: `https://username.github.io/repo-name/`

## 🔧 Troubleshooting

### "Not in a Git repository"
```bash
git init
git remote add origin https://github.com/username/repo-name.git
```

### "ngrok command not found"
Install ngrok from: https://ngrok.com/download

### "Authentication failed"
Ngrok free tier works without auth token. For custom domains, get token from ngrok dashboard.

### Audio not playing
- Check if `auto-deploy.js` is still running
- Verify tunnel URL in browser dev console
- Ensure audio files are in `/audio` folder

## 📞 Support

If you encounter issues:
1. Check the terminal output for error messages
2. Verify all requirements are installed
3. Ensure GitHub Pages is enabled
4. Check that audio files exist locally

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**
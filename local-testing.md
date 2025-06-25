# Local Testing Guide

## Why Use a Local Server?
Audio files and some browser security features require a web server (not just file:// protocol).

## Option 1: Python Server (if you have Python)
```bash
# Navigate to your project
cd /Users/shivin/Desktop/agora-app-builder/scheduled-audio-player

# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Then open: http://localhost:8000
```

## Option 2: Node.js Server (if you have Node.js)
```bash
# Install a simple server globally
npm install -g http-server

# Navigate to project and run
cd /Users/shivin/Desktop/agora-app-builder/scheduled-audio-player
http-server

# Then open: http://localhost:8080
```

## Option 3: PHP Server (if you have PHP)
```bash
cd /Users/shivin/Desktop/agora-app-builder/scheduled-audio-player
php -S localhost:8000

# Then open: http://localhost:8000
```

## Option 4: VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click on index.html
3. Select "Open with Live Server"

## What to Test:
1. **Time Display**: Check if scheduled times show correctly
2. **Countdown**: Set a test time 2 minutes in the future
3. **Audio Loading**: Add a test MP3 file in the audio/ folder
4. **Protection**: Try right-clicking (should be disabled)
5. **Responsive Design**: Test on different screen sizes
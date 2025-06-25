# Scheduled Audio Player with Google Drive Integration

A secure, time-based audio streaming system for educational purposes. Students can browse available classes, see individual countdowns, and choose which class to attend. Audio files are streamed directly from Google Drive - no file uploads to GitHub required!

## 🎯 Features

### 📚 **Class Management**
- **Class List Interface**: Browse all available audio classes in one view
- **Individual Counters**: Each class shows its own countdown timer and availability status
- **Class Selection**: Students can choose which class to attend from the list
- **Real-time Status**: Live updates showing which classes are available, upcoming, or live
- **Smart Navigation**: Easy switching between class list and individual class players

### 🔒 **Security & Access Control**
- **Time-Based Access Control**: Audio becomes available only at predetermined times
- **Anti-Download Protection**: Multiple layers of protection to prevent unauthorized downloading
- **Session Management**: Secure audio streaming with automatic cleanup
- **Content Protection**: Right-click blocking, keyboard shortcut prevention, developer tools detection

### 📱 **User Experience**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Automatic Updates**: Real-time countdown timers and status updates every 30 seconds
- **Keyboard Controls**: Space bar to play/pause, arrow keys for seeking and volume
- **Progress Tracking**: Visual progress bar with time indicators
- **Status Messages**: Clear feedback about class availability and timing
- **Mobile Optimized**: Touch-friendly controls and responsive layout

## 🚀 Quick Start

### 1. Upload Audio to Google Drive

1. **Upload your MP3 files** to Google Drive
2. **Share each file**: Right-click → Share → "Anyone with the link" → "Viewer"
3. **Copy the file ID** from the sharing link

**Example sharing link:**
```
https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view
```
**File ID:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2. Configure Your Classes

Edit `config.js` with your Google Drive file IDs:

```javascript
schedule: [
    {
        id: 'kirtana-class',
        title: 'Hare Krishna Kirtana',
        description: 'Beautiful chanting session',
        startTime: '2024-01-15T10:00:00', // ISO 8601 format
        endTime: '2024-01-15T11:30:00',   // Optional
        audioFile: 'Hare Krishna Kirtana.mp3', // Display name
        googleDriveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        notes: `<h3>Today's Kirtana:</h3><ul><li>Hare Krishna mantra</li></ul>`,
        timezone: 'India/Kolkata'
    }
]
```

### 3. Deploy to GitHub Pages

1. **Create a new repository** on GitHub
2. **Upload all files** to the repository
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click Save

Your audio player will be available at: `https://yourusername.github.io/your-repo-name/`

## 📁 File Structure

```
scheduled-audio-player/
├── index.html              # Main HTML file
├── styles.css              # Responsive CSS styling
├── config.js               # Class schedule configuration
├── scheduler.js            # Time-based scheduling logic
├── player.js               # Audio player controls
├── audio-protection.js     # Anti-download protection
├── audio/                  # Audio files directory
│   └── your-audio-files.mp3
└── README.md              # This file
```

## ⚙️ Configuration Options

### Schedule Settings
- `startTime`: When the class becomes available (ISO 8601 format)
- `endTime`: When the class ends (optional)
- `audioFile`: Path to the audio file
- `bufferTimeMinutes`: How early students can access (default: 5 minutes)
- `gracePeriodMinutes`: How long after class ends to keep available (default: 30 minutes)

### Protection Settings
- `disableRightClick`: Prevent right-click context menu
- `blockKeyboardShortcuts`: Block Ctrl+S, F12, etc.
- `detectDevTools`: Detect when developer tools are opened
- `showConsoleWarnings`: Show warnings in browser console

### Player Settings
- `autoPlay`: Auto-start when class begins (be careful with browser policies)
- `defaultVolume`: Initial volume level (0-100)
- `pauseOnBlur`: Pause when user switches tabs
- `showCountdown`: Show countdown timer before class starts

## 🔒 Security Features

### Anti-Download Protection
- **Right-click disabled** on audio elements
- **Keyboard shortcuts blocked** (Ctrl+S, F12, etc.)
- **Audio source obfuscation** using blob URLs
- **Developer tools detection** with automatic pause
- **Console warnings** for unauthorized access attempts
- **Drag-and-drop prevention** for media elements

### Access Control
- **Time-based availability** - content only accessible during scheduled periods
- **Buffer time** - allows early access (configurable)
- **Grace period** - keeps content available after class ends
- **Automatic cleanup** - removes blob URLs after timeout

## 🎨 Customization

### Styling
Edit `styles.css` or modify the `ui` section in `config.js`:

```javascript
ui: {
    colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#27ae60',
        warning: '#ffa502',
        error: '#ff4757'
    },
    siteTitle: 'Your Audio Class Player',
    timeFormat: 12 // or 24
}
```

### Adding New Classes
Use the helper functions in the browser console:

```javascript
// Add a new class
addClass({
    id: 'new-class',
    title: 'New Class Title',
    startTime: '2024-01-20T14:00:00',
    audioFile: 'audio/new-class.mp3'
});

// Update an existing class
updateClass('class-001', {
    title: 'Updated Title',
    startTime: '2024-01-15T11:00:00'
});

// Remove a class
removeClass('class-001');
```

## 🎮 Keyboard Controls

When the audio player is active:
- **Space**: Play/Pause
- **Left Arrow**: Seek backward 10 seconds
- **Right Arrow**: Seek forward 10 seconds
- **Up Arrow**: Increase volume
- **Down Arrow**: Decrease volume
- **M**: Toggle mute

## 📱 Mobile Support

The player is fully responsive and includes:
- Touch-friendly controls
- Responsive layout for all screen sizes
- Mobile-optimized progress bar
- Vertical layout on small screens
- Proper touch event handling

## 🔧 Advanced Features

### Analytics (Optional)
Enable analytics in `config.js`:

```javascript
advanced: {
    enableAnalytics: true,
    analyticsEndpoint: 'https://your-analytics-server.com/track'
}
```

### Session Management
```javascript
advanced: {
    enableSessions: true,
    sessionTimeoutMinutes: 120,
    maxSessions: 1 // Limit concurrent sessions
}
```

## 🚨 Troubleshooting

### Audio Won't Play
1. Check that the audio file path is correct
2. Ensure the audio file is in a supported format (MP3, WAV, OGG)
3. Verify the file is uploaded to the correct directory
4. Check browser console for error messages

### Time Zone Issues
1. Ensure `startTime` is in ISO 8601 format
2. Specify the `timezone` field in your class configuration
3. Test with different time zones if needed

### Protection Not Working
1. Clear browser cache and reload
2. Check that all JavaScript files are loading properly
3. Verify that the protection scripts are included in index.html

### GitHub Pages Not Updating
1. Check that all files are committed and pushed
2. Go to Settings → Pages and verify the source is correct
3. GitHub Pages can take a few minutes to update

## 📄 License

MIT License - feel free to use this for your educational projects!

## 🤝 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your configuration in `config.js`
3. Ensure all files are uploaded correctly
4. Test with different browsers

## 📋 Deployment Checklist

- [ ] Configure class schedule in `config.js`
- [ ] Upload audio files to `audio/` directory
- [ ] Test locally by opening `index.html` in browser
- [ ] Create GitHub repository
- [ ] Upload all files to repository
- [ ] Enable GitHub Pages in repository settings
- [ ] Test live URL
- [ ] Share URL with students

Your secure audio streaming system is now ready! 🎉
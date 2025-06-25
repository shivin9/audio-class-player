#!/bin/bash

# Local Testing Script for Audio Player
echo "🎵 Starting Audio Player Local Test..."
echo ""

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if we have Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found - starting server on port 8000"
    echo "📂 Serving files from: $(pwd)"
    echo ""
    echo "🌐 Open your browser and go to:"
    echo "   http://localhost:8000"
    echo ""
    echo "🔍 What to test:"
    echo "   1. Check countdown timer (should start in ~2 minutes)"
    echo "   2. Try right-click (should be disabled)"
    echo "   3. Wait for player to appear when countdown finishes"
    echo "   4. Test audio playback (make sure you have test-audio.mp3)"
    echo ""
    echo "⏹️  Press Ctrl+C to stop the server"
    echo ""
    
    # Start the server
    python3 -m http.server 8000
    
elif command -v python &> /dev/null; then
    echo "✅ Python found - starting server on port 8000"
    python -m SimpleHTTPServer 8000
    
else
    echo "❌ Python not found. Please install Python or use another method:"
    echo ""
    echo "Alternative 1: Open index.html directly in browser"
    echo "Alternative 2: Use VS Code Live Server extension"
    echo "Alternative 3: Use Node.js: npm install -g http-server && http-server"
fi
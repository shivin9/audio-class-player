#!/bin/bash

echo "🚀 GitHub Upload Script for Kirtana Audio Player"
echo "================================================"
echo ""

# Navigate to the project directory
cd "/Users/shivin/Desktop/agora-app-builder/scheduled-audio-player"

echo "📂 Current directory: $(pwd)"
echo ""

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "   Download from: https://git-scm.com/"
    exit 1
fi

echo "✅ Git is installed"

# Initialize Git repository
echo "🔧 Initializing Git repository..."
git init

# Add all files
echo "📁 Adding all files to Git..."
git add .

# Check if there are files to commit
if git diff --staged --quiet; then
    echo "❌ No files to commit. Please check if files exist."
    exit 1
fi

# Make first commit
echo "💾 Creating first commit..."
git commit -m "Initial commit: Kirtana Audio Player with class selection system

Features:
- Class list interface with individual counters
- Time-based access control for audio classes
- Real-time status updates and countdown timers
- Anti-download protection system
- Responsive design for all devices
- Kirtana and spiritual audio classes"

# Ask for GitHub repository URL
echo ""
echo "📝 Please provide your GitHub repository URL:"
echo "   Example: https://github.com/yourusername/kirtana-audio-player.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ No repository URL provided. Exiting."
    exit 1
fi

# Add remote origin
echo "🔗 Adding remote repository..."
git remote add origin "$REPO_URL"

# Set main branch and push
echo "⬆️ Pushing to GitHub..."
git branch -M main

if git push -u origin main; then
    echo ""
    echo "✅ Successfully uploaded to GitHub!"
    echo ""
    echo "🌐 Next steps:"
    echo "   1. Go to your repository on GitHub"
    echo "   2. Click Settings → Pages"
    echo "   3. Select 'Deploy from a branch'"
    echo "   4. Choose 'main' branch and '/ (root)' folder"
    echo "   5. Your site will be available at:"
    echo "      https://yourusername.github.io/your-repo-name/"
else
    echo ""
    echo "❌ Upload failed. Please check:"
    echo "   1. Repository URL is correct"
    echo "   2. You have write access to the repository"
    echo "   3. Repository exists on GitHub"
    echo ""
    echo "💡 Alternative: Use GitHub web interface to upload files"
fi
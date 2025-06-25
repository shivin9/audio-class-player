# Git Command Line Deployment

## Prerequisites
- Git installed on your computer
- GitHub account

## Step-by-Step Commands

### 1. Navigate to your project directory
```bash
cd /Users/shivin/Desktop/agora-app-builder/scheduled-audio-player
```

### 2. Initialize Git repository
```bash
git init
```

### 3. Add all files
```bash
git add .
```

### 4. Make first commit
```bash
git commit -m "Initial commit: Scheduled Audio Player"
```

### 5. Add GitHub repository as remote
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 6. Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## Example with actual values:
```bash
# If your GitHub username is "john" and repo is "audio-classes"
git remote add origin https://github.com/john/audio-classes.git
git branch -M main
git push -u origin main
```
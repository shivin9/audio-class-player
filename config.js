/**
 * Configuration file for the Scheduled Audio Player
 * Edit this file to set up your class schedules and audio files
 */

window.AUDIO_CONFIG = {
    // Class Schedule Configuration
    schedule: [
        {
            id: 'test-class',
            title: 'Kirtana',
            description: 'Hare Krishna Kirtana',
            startTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),   // 1 hour from now
            audioFile: 'Hare Krsna Kirtana.mp3',
            notes: `
                <h3>Lyrics:</h3>
                <ul>
                    <li>Hare Krsna, Hare Krsna</li>
                    <li>Krsna Krsna Hare Hare</li>
                    <li>Hare Rama, Hare Rama</li>
                    <li>Rama Rama Hare Hare</li>
                </ul>
                <p><strong>Note:</strong> Audio streams from your computer via secure tunnel!</p>
            `,
            timezone: 'India/Kolkata'
        },
        {
            id: 'class-available-now',
            title: '74. Elements of Akarma 1 (29.11.20)',
            description: 'This class is available right now for testing',
            startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Started 10 minutes ago
            endTime: new Date(Date.now() + 50 * 60 * 1000).toISOString(),   // Ends in 50 minutes
            audioFile: '74. Elements of Akarma 1 (29.11.20).mp3',
            notes: `
                <h3>Available Class:</h3>
                <ul>
                    <li>This class is currently available</li>
                    <li>You can click "Join Class" to test the player</li>
                    <li>Audio streams from your computer via tunnel</li>
                </ul>
            `,
            timezone: 'India/Kolkata'
        },
        // {
        //     id: 'class-starting-soon',
        //     title: 'Starting Soon - JavaScript Basics',
        //     description: 'Introduction to JavaScript programming fundamentals',
        //     startTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Starts in 5 minutes
        //     endTime: new Date(Date.now() + 65 * 60 * 1000).toISOString(),  // Ends in 65 minutes
        //     audioFile: 'audio/javascript-basics.mp3',
        //     notes: `
        //         <h3>Today's Topics:</h3>
        //         <ul>
        //             <li>Variables and data types</li>
        //             <li>Functions and scope</li>
        //             <li>DOM manipulation</li>
        //             <li>Event handling</li>
        //         </ul>
        //     `,
        //     timezone: 'America/New_York'
        // },
        // {
        //     id: 'class-003',
        //     title: 'React Fundamentals',
        //     description: 'Building interactive user interfaces with React',
        //     startTime: '2024-01-17T09:00:00',
        //     endTime: '2024-01-17T10:30:00',
        //     audioFile: 'audio/class-003-react-basics.mp3',
        //     notes: `
        //         <h3>Today's Topics:</h3>
        //         <ul>
        //             <li>Components and JSX</li>
        //             <li>Props and state management</li>
        //             <li>Event handling</li>
        //             <li>Lifecycle methods and hooks</li>
        //         </ul>
        //     `,
        //     timezone: 'America/New_York'
        // }
    ],

    // Player Settings
    playerSettings: {
        // Auto-play when class becomes available (be careful with browser policies)
        autoPlay: false,
        
        // Default volume (0-100)
        defaultVolume: 100,
        
        // Pause audio when user switches tabs/windows
        pauseOnBlur: true,
        
        // Show countdown timer before class starts
        showCountdown: true,
        
        // Buffer time in minutes (how early to allow access)
        bufferTimeMinutes: 5,
        
        // Grace period in minutes (how long after end time to keep available)
        gracePeriodMinutes: 30,
        
        // Preload behavior ('none', 'metadata', 'auto')
        preload: 'metadata'
    },

    // Protection Settings
    protection: {
        // Enable right-click protection
        disableRightClick: true,
        
        // Enable keyboard shortcut blocking
        blockKeyboardShortcuts: true,
        
        // Enable developer tools detection
        detectDevTools: true,
        
        // Enable console warnings
        showConsoleWarnings: true,
        
        // Maximum number of simultaneous sessions (0 = unlimited)
        maxSessions: 0
    },

    // UI Customization
    ui: {
        // Site title
        siteTitle: 'Audio Class Player',
        
        // Welcome message
        welcomeMessage: 'Welcome to today\'s BG session',
        
        // Footer text
        footerText: '© 2025 Audio Class System | Protected Content',
        
        // Theme colors (CSS custom properties)
        colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#27ae60',
            warning: '#ffa502',
            error: '#ff4757',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        
        // Show next class information
        showNextClass: true,
        
        // Time format (12 or 24)
        timeFormat: 12
    },

    // Tunnel Configuration (auto-updated by deploy script)
    tunnel: {
        // This gets automatically updated by auto-deploy.js or start-streaming.js
        baseUrl: 'https://29f9-2401-4900-30d2-7121-9c03-af1b-5947-af5b.ngrok-free.app', // Will be set to current tunnel URL
        
        // Auto-detect from tunnel-url.js if available
        autoDetect: true
    },

    // Advanced Settings
    advanced: {
        // Enable analytics/logging (requires server-side implementation)
        enableAnalytics: false,
        
        // Analytics endpoint (if enabled)
        analyticsEndpoint: '',
        
        // Enable session management
        enableSessions: false,
        
        // Session timeout in minutes
        sessionTimeoutMinutes: 120,
        
        // Enable offline mode detection
        detectOffline: true,
        
        // Retry attempts for failed audio loads
        maxRetryAttempts: 3,
        
        // Retry delay in milliseconds
        retryDelayMs: 2000
    }
};

/**
 * Helper function to add a new class to the schedule
 * @param {Object} classInfo - Class information object
 */
window.addClass = function(classInfo) {
    if (!classInfo.id || !classInfo.startTime || !classInfo.audioFile) {
        console.error('Class must have id, startTime, and audioFile properties');
        return false;
    }
    
    window.AUDIO_CONFIG.schedule.push(classInfo);
    console.log('Class added successfully:', classInfo.id);
    return true;
};

/**
 * Helper function to update an existing class
 * @param {string} classId - ID of the class to update
 * @param {Object} updates - Object with properties to update
 */
window.updateClass = function(classId, updates) {
    const classIndex = window.AUDIO_CONFIG.schedule.findIndex(c => c.id === classId);
    if (classIndex === -1) {
        console.error('Class not found:', classId);
        return false;
    }
    
    Object.assign(window.AUDIO_CONFIG.schedule[classIndex], updates);
    console.log('Class updated successfully:', classId);
    return true;
};

/**
 * Helper function to remove a class from the schedule
 * @param {string} classId - ID of the class to remove
 */
window.removeClass = function(classId) {
    const classIndex = window.AUDIO_CONFIG.schedule.findIndex(c => c.id === classId);
    if (classIndex === -1) {
        console.error('Class not found:', classId);
        return false;
    }
    
    window.AUDIO_CONFIG.schedule.splice(classIndex, 1);
    console.log('Class removed successfully:', classId);
    return true;
};

/**
 * Helper function to get current class based on time
 */
window.getCurrentClass = function() {
    const now = new Date();
    return window.AUDIO_CONFIG.schedule.find(classItem => {
        const startTime = new Date(classItem.startTime);
        const endTime = classItem.endTime ? new Date(classItem.endTime) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;
        
        return now >= (startTime.getTime() - bufferTime) && now <= (endTime.getTime() + graceTime);
    });
};

/**
 * Helper function to get next upcoming class
 */
window.getNextClass = function() {
    const now = new Date();
    const upcomingClasses = window.AUDIO_CONFIG.schedule
        .filter(classItem => new Date(classItem.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    return upcomingClasses[0] || null;
};

// Export configuration for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AUDIO_CONFIG;
}
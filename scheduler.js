/**
 * Scheduler System
 * Handles time-based showing/hiding of audio content
 */

class AudioScheduler {
    constructor() {
        this.currentClass = null;
        this.selectedClassId = null;
        this.checkInterval = null;
        this.countdownInterval = null;
        this.init();
    }

    init() {
        // Start with class list instead of auto-selecting
        this.showClassListScreen();
        this.startScheduleChecker();
        this.bindEvents();
    }

    startScheduleChecker() {
        // Check every 30 seconds for schedule updates
        this.checkInterval = setInterval(() => {
            this.updateSelectedClassUI();
        }, 30000);
    }

    showClassListScreen() {
        this.hideAllScreens();
        document.getElementById('class-list-screen').classList.remove('hidden');
        document.getElementById('back-to-list-btn').classList.add('hidden');
        document.getElementById('status').textContent = 'Select a class to join';
    }

    updateSelectedClassUI() {
        // Only update if a class is selected
        if (!this.selectedClassId) return;

        const selectedClass = window.AUDIO_CONFIG.schedule.find(c => c.id === this.selectedClassId);
        if (!selectedClass) {
            // Selected class not found, go back to list
            this.showClassListScreen();
            return;
        }

        const now = new Date();
        const startTime = new Date(selectedClass.startTime);
        const endTime = selectedClass.endTime ? 
            new Date(selectedClass.endTime) : 
            new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

        const effectiveStart = startTime.getTime() - bufferTime;
        const effectiveEnd = endTime.getTime() + graceTime;

        if (now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd) {
            // Class is available
            if (!document.getElementById('player-screen').classList.contains('hidden')) {
                // Already showing player, just update content
                this.updatePlayerContent(selectedClass);
            } else {
                this.showPlayerScreen(selectedClass);
            }
        } else if (now.getTime() < effectiveStart) {
            // Class hasn't started yet
            if (!document.getElementById('waiting-screen').classList.contains('hidden')) {
                // Already showing waiting screen, just update countdown
                this.updateWaitingContent(selectedClass);
            } else {
                this.showWaitingScreen(selectedClass);
            }
        } else {
            // Class has ended
            this.showEndedScreen();
        }
    }

    updateUI() {
        // Legacy method for compatibility - now just updates selected class
        this.updateSelectedClassUI();
    }

    findCurrentClass(now) {
        return window.AUDIO_CONFIG.schedule.find(classItem => {
            const startTime = new Date(classItem.startTime);
            const endTime = classItem.endTime ? 
                new Date(classItem.endTime) : 
                new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

            const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
            const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

            const effectiveStart = startTime.getTime() - bufferTime;
            const effectiveEnd = endTime.getTime() + graceTime;

            return now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd;
        });
    }

    findNextClass(now) {
        const upcomingClasses = window.AUDIO_CONFIG.schedule
            .filter(classItem => {
                const startTime = new Date(classItem.startTime);
                const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
                return now.getTime() < (startTime.getTime() - bufferTime);
            })
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        return upcomingClasses[0] || null;
    }

    showWaitingScreen(nextClass) {
        this.hideAllScreens();
        document.getElementById('waiting-screen').classList.remove('hidden');
        
        // Update waiting screen content
        this.updateWaitingContent(nextClass);
        this.startCountdown(nextClass);
        
        // Update status
        document.getElementById('status').textContent = 'Waiting for class to begin...';
    }

    showPlayerScreen(currentClass) {
        this.hideAllScreens();
        document.getElementById('player-screen').classList.remove('hidden');
        
        // Update player content
        this.updatePlayerContent(currentClass);
        this.loadAudio(currentClass);
        
        // Update status
        document.getElementById('status').textContent = 'Class in session';
        
        this.currentClass = currentClass;
    }

    showEndedScreen() {
        this.hideAllScreens();
        document.getElementById('ended-screen').classList.remove('hidden');
        
        // Update ended screen content
        this.updateEndedContent();
        
        // Update status
        document.getElementById('status').textContent = 'No active classes';
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    updateWaitingContent(nextClass) {
        const startTime = new Date(nextClass.startTime);
        const formattedTime = this.formatDateTime(startTime);
        
        document.getElementById('scheduled-time').textContent = formattedTime;
        
        // Update page title
        document.title = `Waiting - ${nextClass.title || 'Audio Class'}`;
    }

    updatePlayerContent(currentClass) {
        document.getElementById('class-title').textContent = currentClass.title || 'Audio Class in Progress';
        document.getElementById('class-description').textContent = currentClass.description || 'Welcome to today\'s audio session';
        
        // Update class notes if available
        const notesContainer = document.getElementById('class-notes-content');
        if (currentClass.notes) {
            notesContainer.innerHTML = currentClass.notes;
            notesContainer.parentElement.style.display = 'block';
        } else {
            notesContainer.parentElement.style.display = 'none';
        }
        
        // Update page title
        document.title = currentClass.title || 'Audio Class Player';
    }

    updateEndedContent() {
        const nextClass = this.findNextClass(new Date());
        const nextClassInfo = document.getElementById('next-class-info');
        
        if (nextClass && window.AUDIO_CONFIG.ui.showNextClass) {
            const nextTime = this.formatDateTime(new Date(nextClass.startTime));
            nextClassInfo.innerHTML = `
                <h3>Next Class</h3>
                <p><strong>${nextClass.title}</strong></p>
                <p>${nextTime}</p>
            `;
            nextClassInfo.style.display = 'block';
        } else {
            nextClassInfo.style.display = 'none';
        }
        
        // Update page title
        document.title = 'Class Ended - Audio Class Player';
    }

    startCountdown(nextClass) {
        // Clear existing countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        if (!window.AUDIO_CONFIG.playerSettings.showCountdown) {
            document.getElementById('countdown').style.display = 'none';
            return;
        }

        const startTime = new Date(nextClass.startTime);
        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const effectiveStart = startTime.getTime() - bufferTime;

        this.countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const timeLeft = effectiveStart - now;

            if (timeLeft <= 0) {
                clearInterval(this.countdownInterval);
                this.updateUI(); // Refresh to show player
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            let countdownText = '';
            if (days > 0) {
                countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                countdownText = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                countdownText = `${minutes}m ${seconds}s`;
            } else {
                countdownText = `${seconds}s`;
            }

            document.getElementById('countdown').textContent = countdownText;
        }, 1000);
    }

    async loadAudio(currentClass) {
        const audioPlayer = document.getElementById('audio-player');
        const audioFile = currentClass.audioFile;

        if (!audioFile) {
            console.error('No audio file specified for class:', currentClass.id);
            this.showAudioError('Audio file not configured for this class');
            return;
        }

        try {
            console.log('🔗 Loading audio via secure tunnel...');
            console.log(`📁 File: ${audioFile}`);

            // Use tunnel audio manager for secure streaming
            if (window.TunnelAudioManager) {
                await window.TunnelAudioManager.loadProtectedAudio(audioPlayer, audioFile, currentClass.id);
            } else {
                // Fallback to local audio for development
                console.log('🏠 Tunnel not available, using local audio...');
                audioPlayer.src = `audio/${audioFile}`;
            }

            // Set initial volume
            audioPlayer.volume = window.AUDIO_CONFIG.playerSettings.defaultVolume / 100;
            
            // Configure audio element
            audioPlayer.preload = window.AUDIO_CONFIG.playerSettings.preload;
            audioPlayer.controlsList = 'nodownload nofullscreen noremoteplayback';
            audioPlayer.disablePictureInPicture = true;

            console.log('✅ Audio configured for tunnel streaming');

        } catch (error) {
            console.error('❌ Failed to load audio via tunnel:', error);
            this.showAudioError(`Failed to load audio: ${error.message}`);
        }
    }

    showAudioError(customMessage = null) {
        const playerContainer = document.querySelector('.audio-player-container');
        
        // Remove any existing error messages
        const existingError = playerContainer.querySelector('.audio-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'audio-error';
        
        const message = customMessage || 'Unable to load audio via tunnel. Please check tunnel connection and file availability.';
        
        errorDiv.innerHTML = `
            <div style="
                background: #ff4757;
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
                line-height: 1.5;
            ">
                ❌ ${message}
                <br>
                <small style="opacity: 0.9; margin-top: 10px; display: block;">
                    Make sure your streaming server is running and tunnel is connected.
                </small>
            </div>
        `;
        playerContainer.appendChild(errorDiv);
    }

    formatDateTime(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        };

        if (window.AUDIO_CONFIG.ui.timeFormat === 24) {
            options.hour12 = false;
        }

        return date.toLocaleDateString('en-US', options);
    }

    bindEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, check for updates
                this.updateUI();
            }
        });

        // Handle online/offline status
        if (window.AUDIO_CONFIG.advanced.detectOffline) {
            window.addEventListener('online', () => {
                console.log('Connection restored');
                this.updateUI();
            });

            window.addEventListener('offline', () => {
                console.log('Connection lost');
                this.showOfflineWarning();
            });
        }

        // Handle window focus/blur for audio controls
        window.addEventListener('blur', () => {
            if (window.AUDIO_CONFIG.playerSettings.pauseOnBlur) {
                const audio = document.getElementById('audio-player');
                if (audio && !audio.paused) {
                    audio.pause();
                }
            }
        });
    }

    showOfflineWarning() {
        const warning = document.createElement('div');
        warning.id = 'offline-warning';
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ffa502;
                color: white;
                padding: 10px;
                text-align: center;
                z-index: 10000;
                font-weight: bold;
            ">
                📡 No internet connection. Audio may not load properly.
            </div>
        `;
        document.body.appendChild(warning);

        // Remove when back online
        const removeWarning = () => {
            const warningEl = document.getElementById('offline-warning');
            if (warningEl) {
                warningEl.remove();
            }
            window.removeEventListener('online', removeWarning);
        };
        window.addEventListener('online', removeWarning);
    }

    // Public method to manually refresh schedule
    refresh() {
        this.updateUI();
    }

    // Cleanup method
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}

// Initialize scheduler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Validate config before starting
    if (!window.AUDIO_CONFIG || !window.AUDIO_CONFIG.schedule || window.AUDIO_CONFIG.schedule.length === 0) {
        console.error('No audio classes configured. Please check config.js');
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: #f8f9fa;
                font-family: Arial, sans-serif;
                text-align: center;
                color: #666;
            ">
                <div>
                    <h2>⚠️ Configuration Error</h2>
                    <p>No audio classes have been configured.</p>
                    <p>Please check the config.js file.</p>
                </div>
            </div>
        `;
        return;
    }

    window.audioScheduler = new AudioScheduler();
});

// Export for external use
window.AudioScheduler = AudioScheduler;
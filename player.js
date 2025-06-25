/**
 * Audio Player Controls
 * Handles audio playback interface and interactions
 */

class AudioPlayerController {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 80;
        this.init();
    }

    init() {
        this.bindPlayerEvents();
        this.setupVolumeControl();
        this.setupProgressControl();
        this.setupKeyboardShortcuts();
    }

    bindPlayerEvents() {
        // Wait for audio element to be available
        const checkAudio = () => {
            this.audio = document.getElementById('audio-player');
            if (this.audio) {
                this.setupAudioEvents();
            } else {
                // Check again in 100ms
                setTimeout(checkAudio, 100);
            }
        };
        checkAudio();

        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
    }

    setupAudioEvents() {
        if (!this.audio) return;

        // Audio loaded
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateDurationDisplay();
            console.log('Audio metadata loaded, duration:', this.duration);
        });

        this.audio.addEventListener('loadeddata', () => {
            console.log('Audio data loaded');
        });

        // Time update
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.updateProgress();
            this.updateTimeDisplay();
        });

        // Play/Pause events
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.logActivity('play');
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.logActivity('pause');
        });

        // Ended event
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.logActivity('ended');
            this.showCompletionMessage();
        });

        // Error handling
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showAudioError();
        });

        // Loading events
        this.audio.addEventListener('loadstart', () => {
            this.showLoadingState();
        });

        this.audio.addEventListener('canplaythrough', () => {
            this.hideLoadingState();
        });

        // Volume change
        this.audio.addEventListener('volumechange', () => {
            this.volume = this.audio.volume * 100;
            this.updateVolumeSlider();
        });

        // Seeking events
        this.audio.addEventListener('seeking', () => {
            console.log('Seeking to:', this.audio.currentTime);
        });

        this.audio.addEventListener('seeked', () => {
            console.log('Seeked to:', this.audio.currentTime);
            this.logActivity('seek', { time: this.audio.currentTime });
        });
    }

    togglePlayPause() {
        if (!this.audio) return;

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            // Check if audio is ready to play
            if (this.audio.readyState >= 2) {
                this.audio.play().catch(error => {
                    console.error('Playback failed:', error);
                    this.showPlaybackError();
                });
            } else {
                this.showLoadingMessage();
            }
        }
    }

    updatePlayButton() {
        const playBtn = document.getElementById('play-pause-btn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play';
            playBtn.setAttribute('aria-label', this.isPlaying ? 'Pause audio' : 'Play audio');
        }
    }

    setupVolumeControl() {
        const volumeSlider = document.getElementById('volume');
        if (volumeSlider) {
            volumeSlider.value = window.AUDIO_CONFIG.playerSettings.defaultVolume;
            
            volumeSlider.addEventListener('input', (e) => {
                this.volume = parseInt(e.target.value);
                if (this.audio) {
                    this.audio.volume = this.volume / 100;
                }
            });

            volumeSlider.addEventListener('change', () => {
                this.logActivity('volume_change', { volume: this.volume });
            });
        }
    }

    updateVolumeSlider() {
        const volumeSlider = document.getElementById('volume');
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }

    setupProgressControl() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                if (!this.audio || !this.duration) return;

                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                const percentage = clickX / width;
                const newTime = this.duration * percentage;

                this.audio.currentTime = newTime;
            });
        }
    }

    updateProgress() {
        if (!this.duration) return;

        const percentage = (this.currentTime / this.duration) * 100;
        const progressFill = document.getElementById('progress');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    updateTimeDisplay() {
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');

        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        }
    }

    updateDurationDisplay() {
        const durationEl = document.getElementById('duration');
        if (durationEl && this.duration) {
            durationEl.textContent = this.formatTime(this.duration);
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when player is visible
            const playerScreen = document.getElementById('player-screen');
            if (!playerScreen || playerScreen.classList.contains('hidden')) return;

            // Prevent shortcuts if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seekBackward();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seekForward();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.increaseVolume();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.decreaseVolume();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    this.toggleMute();
                    break;
            }
        });
    }

    seekBackward(seconds = 10) {
        if (!this.audio) return;
        this.audio.currentTime = Math.max(0, this.audio.currentTime - seconds);
    }

    seekForward(seconds = 10) {
        if (!this.audio) return;
        this.audio.currentTime = Math.min(this.duration, this.audio.currentTime + seconds);
    }

    increaseVolume(amount = 5) {
        this.volume = Math.min(100, this.volume + amount);
        if (this.audio) {
            this.audio.volume = this.volume / 100;
        }
        this.updateVolumeSlider();
    }

    decreaseVolume(amount = 5) {
        this.volume = Math.max(0, this.volume - amount);
        if (this.audio) {
            this.audio.volume = this.volume / 100;
        }
        this.updateVolumeSlider();
    }

    toggleMute() {
        if (!this.audio) return;
        this.audio.muted = !this.audio.muted;
        console.log('Muted:', this.audio.muted);
    }

    showLoadingState() {
        const playBtn = document.getElementById('play-pause-btn');
        if (playBtn) {
            playBtn.innerHTML = '<span class="loading"></span> Loading...';
            playBtn.disabled = true;
        }
    }

    hideLoadingState() {
        const playBtn = document.getElementById('play-pause-btn');
        if (playBtn) {
            playBtn.disabled = false;
            this.updatePlayButton();
        }
    }

    showLoadingMessage() {
        this.showToast('Loading audio... Please wait.', 'info');
    }

    showPlaybackError() {
        this.showToast('Unable to play audio. Please try refreshing the page.', 'error');
    }

    showAudioError() {
        this.showToast('Audio failed to load. Please check your connection and try again.', 'error');
    }

    showCompletionMessage() {
        this.showToast('Audio playback completed!', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12'
        };

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);

        // Add click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        });
    }

    logActivity(action, data = {}) {
        if (!window.AUDIO_CONFIG.advanced.enableAnalytics) return;

        const logData = {
            timestamp: new Date().toISOString(),
            action: action,
            classId: window.audioScheduler?.currentClass?.id,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.log('Activity:', logData);

        // Send to analytics endpoint if configured
        if (window.AUDIO_CONFIG.advanced.analyticsEndpoint) {
            fetch(window.AUDIO_CONFIG.advanced.analyticsEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logData)
            }).catch(error => {
                console.error('Analytics logging failed:', error);
            });
        }
    }

    // Public methods for external control
    play() {
        if (this.audio && this.audio.paused) {
            this.audio.play().catch(console.error);
        }
    }

    pause() {
        if (this.audio && !this.audio.paused) {
            this.audio.pause();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        if (this.audio) {
            this.audio.volume = this.volume / 100;
        }
        this.updateVolumeSlider();
    }

    getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume,
            readyState: this.audio?.readyState || 0
        };
    }
}

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .toast {
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .toast:hover {
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);

// Initialize player controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.audioPlayerController = new AudioPlayerController();
});

// Export for external use
window.AudioPlayerController = AudioPlayerController;
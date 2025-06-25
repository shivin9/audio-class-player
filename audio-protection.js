/**
 * Audio Protection System
 * Prevents downloading and unauthorized access to audio content
 */

class AudioProtection {
    constructor() {
        this.initProtection();
        this.setupEventListeners();
    }

    initProtection() {
        // Disable right-click context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Disable common keyboard shortcuts for downloading/saving
        document.addEventListener('keydown', (e) => {
            // Disable Ctrl+S (Save), Ctrl+A (Select All), F12 (DevTools), etc.
            if (
                (e.ctrlKey && (e.key === 's' || e.key === 'a' || e.key === 'u')) ||
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
            ) {
                e.preventDefault();
                this.showProtectionWarning();
                return false;
            }
        });

        // Disable text selection on sensitive elements
        this.disableSelection();

        // Add audio-specific protections
        this.setupAudioProtection();

        // Prevent drag and drop
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });

        // Console warning
        this.showConsoleWarning();
    }

    setupEventListeners() {
        // Monitor for suspicious activity
        let devToolsOpen = false;
        let threshold = 160;

        // Detect DevTools opening (basic detection)
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devToolsOpen) {
                    devToolsOpen = true;
                    this.handleDevToolsDetection();
                }
            } else {
                devToolsOpen = false;
            }
        }, 500);

        // Blur event handling (when user switches tabs/apps)
        window.addEventListener('blur', () => {
            this.pauseAudioOnBlur();
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAudioOnHidden();
            }
        });
    }

    setupAudioProtection() {
        // Override common audio download methods
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'a' && element.download !== undefined) {
                // Disable download attribute
                Object.defineProperty(element, 'download', {
                    get: () => '',
                    set: () => {},
                    configurable: false
                });
            }
            
            return element;
        };

        // Prevent direct audio URL access
        this.obfuscateAudioSource();
    }

    disableSelection() {
        const style = document.createElement('style');
        style.textContent = `
            .protected-content {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }
            
            audio::-webkit-media-controls-download-button {
                display: none !important;
            }
            
            audio::-webkit-media-controls-enclosure {
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);

        // Apply protection class to audio elements
        setTimeout(() => {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.classList.add('protected-content');
                audio.controlsList = 'nodownload nofullscreen noremoteplayback';
                audio.disablePictureInPicture = true;
            });
        }, 1000);
    }

    obfuscateAudioSource() {
        // Create a proxy for audio source to make direct access harder
        window.AudioProtectionProxy = {
            createSecureAudioElement: (src, element) => {
                // Create blob URL for additional protection
                return fetch(src)
                    .then(response => response.blob())
                    .then(blob => {
                        const blobUrl = URL.createObjectURL(blob);
                        element.src = blobUrl;
                        
                        // Clean up blob URL after a delay
                        setTimeout(() => {
                            URL.revokeObjectURL(blobUrl);
                        }, 300000); // 5 minutes
                        
                        return element;
                    })
                    .catch(error => {
                        console.error('Audio loading error:', error);
                        this.showLoadingError();
                    });
            }
        };
    }

    showProtectionWarning() {
        const warning = document.createElement('div');
        warning.className = 'protection-warning';
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #ff4757;
                color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h3>⚠️ Content Protected</h3>
                <p>This audio content is protected and cannot be downloaded or saved.</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-top: 10px; padding: 8px 16px; background: white; color: #ff4757; border: none; border-radius: 5px; cursor: pointer;">
                    OK
                </button>
            </div>
        `;
        document.body.appendChild(warning);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 3000);
    }

    showConsoleWarning() {
        const styles = [
            'color: #ff4757',
            'font-size: 20px',
            'font-weight: bold',
            'text-shadow: 2px 2px 4px rgba(0,0,0,0.5)'
        ].join(';');

        console.log('%c⚠️ WARNING: This content is protected!', styles);
        console.log('%cUnauthorized downloading or distribution of this audio content is prohibited.', 'color: #ff4757; font-size: 14px;');
        console.log('%cAny attempt to bypass these protections may be logged and reported.', 'color: #ff4757; font-size: 14px;');
    }

    handleDevToolsDetection() {
        // Log suspicious activity (in a real app, you might send this to a server)
        console.warn('Developer tools detected - monitoring activity');
        
        // Optionally pause audio when dev tools are open
        const audio = document.getElementById('audio-player');
        if (audio && !audio.paused) {
            audio.pause();
            this.showDevToolsWarning();
        }
    }

    showDevToolsWarning() {
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ffa502;
                color: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 300px;
                font-family: Arial, sans-serif;
                font-size: 14px;
            ">
                <strong>⚠️ Developer Tools Detected</strong><br>
                Audio playback has been paused for content protection.
            </div>
        `;
        document.body.appendChild(warning);

        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 5000);
    }

    pauseAudioOnBlur() {
        // Optional: Pause audio when window loses focus
        const audio = document.getElementById('audio-player');
        if (audio && window.AUDIO_CONFIG && window.AUDIO_CONFIG.pauseOnBlur) {
            audio.pause();
        }
    }

    pauseAudioOnHidden() {
        // Pause audio when page becomes hidden
        const audio = document.getElementById('audio-player');
        if (audio && document.hidden) {
            audio.pause();
        }
    }

    showLoadingError() {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                background: #ff4757;
                color: white;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            ">
                ❌ Audio loading failed. Please refresh the page and try again.
            </div>
        `;
        
        const playerContainer = document.querySelector('.audio-player-container');
        if (playerContainer) {
            playerContainer.appendChild(errorDiv);
        }
    }

    // Method to securely load audio with protection
    static loadProtectedAudio(audioElement, audioUrl) {
        if (window.AudioProtectionProxy) {
            return window.AudioProtectionProxy.createSecureAudioElement(audioUrl, audioElement);
        } else {
            // Fallback method
            audioElement.src = audioUrl;
            return Promise.resolve(audioElement);
        }
    }
}

// Initialize protection when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.audioProtection = new AudioProtection();
});

// Export for use in other scripts
window.AudioProtection = AudioProtection;
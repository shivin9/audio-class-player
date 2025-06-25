/**
 * Tunnel Audio Manager
 * Handles authentication and streaming from tunnel server
 */

class TunnelAudioManager {
    constructor() {
        this.tunnelConfig = null;
        this.authToken = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        await this.loadTunnelConfig();
        this.bindEvents();
    }

    async loadTunnelConfig() {
        // Try to load tunnel configuration
        try {
            // First check if tunnel config is available from config.js
            if (window.AUDIO_CONFIG?.tunnel?.baseUrl) {
                const baseUrl = window.AUDIO_CONFIG.tunnel.baseUrl;
                console.log('🔗 Using tunnel URL from config.js:', baseUrl);
                this.setupTunnelConfig(baseUrl);
                return;
            }

            // Check if tunnel config is available from tunnel-url.js global
            if (window.TUNNEL_CONFIG) {
                this.tunnelConfig = window.TUNNEL_CONFIG;
                console.log('🔗 Tunnel configuration loaded:', this.tunnelConfig.baseUrl);
                await this.testConnection();
                return;
            }

            // Try to load from tunnel-url.js file
            const script = document.createElement('script');
            script.src = 'tunnel-url.js';
            script.onload = async () => {
                if (window.TUNNEL_CONFIG) {
                    this.tunnelConfig = window.TUNNEL_CONFIG;
                    console.log('🔗 Tunnel configuration loaded from file');
                    await this.testConnection();
                }
            };
            script.onerror = () => {
                console.log('ℹ️ No tunnel configuration found');
                this.promptForTunnelUrl();
            };
            document.head.appendChild(script);

        } catch (error) {
            console.log('ℹ️ Tunnel not available:', error.message);
            this.promptForTunnelUrl();
        }
    }

    setupLocalMode() {
        // Fallback to local development server
        this.tunnelConfig = {
            baseUrl: 'http://localhost:3000',
            audioEndpoint: 'http://localhost:3000/audio/',
            authEndpoint: 'http://localhost:3000/auth',
            healthEndpoint: 'http://localhost:3000/health'
        };
        console.log('🏠 Using local development mode');
    }

    async testConnection() {
        if (!this.tunnelConfig) return false;

        try {
            const response = await fetch(this.tunnelConfig.healthEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                console.log('✅ Tunnel connection successful:', data);
                return true;
            } else {
                throw new Error(`Health check failed: ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Tunnel connection failed:', error.message);
            this.isConnected = false;
            return false;
        }
    }

    async authenticate(classId, studentId = null) {
        if (!this.tunnelConfig) {
            throw new Error('Tunnel configuration not available');
        }

        try {
            const response = await fetch(this.tunnelConfig.authEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    classId: classId,
                    studentId: studentId || `student_${Date.now()}`
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Authentication failed');
            }

            const data = await response.json();
            this.authToken = data.token;
            
            console.log('🔑 Authentication successful for class:', classId);
            
            // Store token with expiry
            const tokenData = {
                token: this.authToken,
                classId: classId,
                expiresAt: data.expiresAt,
                createdAt: Date.now()
            };
            
            localStorage.setItem('tunnel_auth_token', JSON.stringify(tokenData));
            
            return this.authToken;
        } catch (error) {
            console.error('❌ Authentication failed:', error.message);
            throw error;
        }
    }

    getStoredToken(classId) {
        try {
            const stored = localStorage.getItem('tunnel_auth_token');
            if (!stored) return null;

            const tokenData = JSON.parse(stored);
            
            // Check if token is for the same class and not expired
            if (tokenData.classId === classId && Date.now() < tokenData.expiresAt) {
                this.authToken = tokenData.token;
                return tokenData.token;
            } else {
                // Remove expired token
                localStorage.removeItem('tunnel_auth_token');
                return null;
            }
        } catch (error) {
            console.log('Failed to retrieve stored token:', error.message);
            return null;
        }
    }

    async getAudioUrl(filename, classId) {
        if (!this.tunnelConfig) {
            throw new Error('Tunnel configuration not available');
        }

        // Try to use stored token first
        let token = this.getStoredToken(classId);
        
        // If no valid stored token, authenticate
        if (!token) {
            token = await this.authenticate(classId);
        }

        // Encode filename to handle spaces and special characters
        const encodedFilename = encodeURIComponent(filename);
        const audioUrl = `${this.tunnelConfig.audioEndpoint}${encodedFilename}?token=${token}`;
        
        console.log('🎵 Generated audio URL for:', filename);
        return audioUrl;
    }

    async loadAudioWithAuth(audioElement, filename, classId) {
        try {
            const audioUrl = await this.getAudioUrl(filename, classId);
            
            // Set up authenticated request
            audioElement.crossOrigin = 'anonymous';
            audioElement.preload = 'metadata';
            
            return new Promise((resolve, reject) => {
                const handleLoad = () => {
                    console.log('✅ Audio loaded successfully:', filename);
                    audioElement.removeEventListener('loadeddata', handleLoad);
                    audioElement.removeEventListener('error', handleError);
                    resolve(audioElement);
                };

                const handleError = async (error) => {
                    console.log('❌ Audio load failed, retrying with new token...');
                    audioElement.removeEventListener('loadeddata', handleLoad);
                    audioElement.removeEventListener('error', handleError);
                    
                    if (this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        
                        // Clear stored token and try again
                        localStorage.removeItem('tunnel_auth_token');
                        this.authToken = null;
                        
                        try {
                            const newUrl = await this.getAudioUrl(filename, classId);
                            audioElement.src = newUrl;
                        } catch (retryError) {
                            reject(retryError);
                        }
                    } else {
                        reject(new Error('Failed to load audio after multiple attempts'));
                    }
                };

                audioElement.addEventListener('loadeddata', handleLoad);
                audioElement.addEventListener('error', handleError);
                
                audioElement.src = audioUrl;
            });

        } catch (error) {
            console.error('❌ Failed to load audio with authentication:', error.message);
            throw error;
        }
    }

    async refreshToken(classId) {
        // Clear stored token and get a new one
        localStorage.removeItem('tunnel_auth_token');
        this.authToken = null;
        return await this.authenticate(classId);
    }

    bindEvents() {
        // Handle network changes
        window.addEventListener('online', () => {
            console.log('🌐 Network connection restored');
            this.testConnection();
        });

        window.addEventListener('offline', () => {
            console.log('📡 Network connection lost');
            this.isConnected = false;
        });

        // Periodic connection check
        setInterval(async () => {
            if (this.tunnelConfig && !this.isConnected) {
                console.log('🔄 Checking tunnel connection...');
                await this.testConnection();
            }
        }, 30000); // Check every 30 seconds
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            tunnelUrl: this.tunnelConfig?.baseUrl || null,
            hasAuthToken: !!this.authToken,
            retryCount: this.retryCount
        };
    }

    showConnectionStatus() {
        const status = this.getConnectionStatus();
        const statusElement = document.getElementById('tunnel-status');
        
        if (statusElement) {
            if (status.isConnected) {
                statusElement.innerHTML = `
                    <div style="color: #27ae60; font-size: 0.9rem;">
                        🔗 Connected to: ${status.tunnelUrl}
                    </div>
                `;
            } else {
                statusElement.innerHTML = `
                    <div style="color: #e74c3c; font-size: 0.9rem;">
                        ❌ Streaming server offline - audio not available
                    </div>
                `;
            }
        }
    }

    // Helper method for backward compatibility with existing player
    static async loadProtectedAudio(audioElement, audioFile, classId) {
        const manager = window.tunnelAudioManager || new TunnelAudioManager();
        
        // Check if tunnel is available
        if (!manager.tunnelConfig || !manager.isConnected) {
            throw new Error('Streaming server not available - please make sure the tunnel is running');
        }
        
        try {
            await manager.loadAudioWithAuth(audioElement, audioFile, classId);
            return audioElement;
        } catch (error) {
            console.error('Failed to load audio via tunnel:', error.message);
            throw new Error(`Tunnel streaming failed: ${error.message}`);
        }
    }
}

// Initialize tunnel audio manager
document.addEventListener('DOMContentLoaded', () => {
    window.tunnelAudioManager = new TunnelAudioManager();
    
    // Add connection status to header if element exists
    setTimeout(() => {
        if (window.tunnelAudioManager) {
            window.tunnelAudioManager.showConnectionStatus();
        }
    }, 2000);
});

// Override the AudioProtection.loadProtectedAudio method
window.TunnelAudioManager = TunnelAudioManager;
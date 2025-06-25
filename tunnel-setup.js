/**
 * Tunnel Setup and Management
 * Creates secure tunnels for audio streaming using ngrok or cloudflare
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

class TunnelManager {
    constructor(options = {}) {
        this.serverPort = options.serverPort || 3000;
        this.tunnelService = options.tunnelService || 'ngrok'; // 'ngrok' or 'cloudflare'
        this.authToken = options.authToken || null;
        this.subdomain = options.subdomain || null;
        this.tunnelProcess = null;
        this.tunnelUrl = null;
        this.configFile = path.join(__dirname, 'tunnel-config.json');
        
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                this.authToken = this.authToken || config.authToken;
                this.subdomain = this.subdomain || config.subdomain;
                this.tunnelService = this.tunnelService || config.tunnelService;
            }
        } catch (error) {
            console.log('ℹ️ No existing tunnel config found, using defaults');
        }
    }

    saveConfig() {
        const config = {
            authToken: this.authToken,
            subdomain: this.subdomain,
            tunnelService: this.tunnelService,
            lastUpdated: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            console.log('💾 Tunnel configuration saved');
        } catch (error) {
            console.error('❌ Failed to save tunnel config:', error.message);
        }
    }

    async checkDependencies() {
        const services = {
            ngrok: {
                command: 'ngrok',
                installUrl: 'https://ngrok.com/download',
                checkCommand: 'ngrok --version'
            },
            cloudflare: {
                command: 'cloudflared',
                installUrl: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation',
                checkCommand: 'cloudflared --version'
            }
        };

        const service = services[this.tunnelService];
        if (!service) {
            throw new Error(`Unknown tunnel service: ${this.tunnelService}`);
        }

        return new Promise((resolve, reject) => {
            exec(service.checkCommand, (error) => {
                if (error) {
                    reject(new Error(`${service.command} not found. Please install from: ${service.installUrl}`));
                } else {
                    console.log(`✅ ${service.command} is installed`);
                    resolve(true);
                }
            });
        });
    }

    async setupNgrok() {
        if (this.authToken) {
            return new Promise((resolve, reject) => {
                console.log('🔐 Setting up ngrok auth token...');
                exec(`ngrok config add-authtoken ${this.authToken}`, (error) => {
                    if (error) {
                        reject(new Error(`Failed to set ngrok auth token: ${error.message}`));
                    } else {
                        console.log('✅ Ngrok auth token configured');
                        resolve();
                    }
                });
            });
        }
    }

    async startTunnel() {
        try {
            await this.checkDependencies();

            if (this.tunnelService === 'ngrok') {
                await this.setupNgrok();
                return this.startNgrokTunnel();
            } else if (this.tunnelService === 'cloudflare') {
                return this.startCloudflareTunnel();
            }
        } catch (error) {
            throw error;
        }
    }

    startNgrokTunnel() {
        return new Promise((resolve, reject) => {
            console.log(`🚇 Starting ngrok tunnel on port ${this.serverPort}...`);
            
            let args = ['http', this.serverPort.toString(), '--log=stdout'];
            
            if (this.subdomain && this.authToken) {
                args.push(`--subdomain=${this.subdomain}`);
            }

            this.tunnelProcess = spawn('ngrok', args);

            let tunnelStarted = false;

            this.tunnelProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('📡 Ngrok:', output.trim());

                // Parse ngrok output to get tunnel URL - updated patterns for new ngrok format
                const urlPatterns = [
                    /url=(https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app)/,  // New format
                    /url=(https:\/\/[a-zA-Z0-9-]+\.ngrok\.io)/,        // Legacy format
                    /(https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app)/,     // Direct match new
                    /(https:\/\/[a-zA-Z0-9-]+\.ngrok\.io)/            // Direct match legacy
                ];

                for (const pattern of urlPatterns) {
                    const urlMatch = output.match(pattern);
                    if (urlMatch && !tunnelStarted) {
                        this.tunnelUrl = urlMatch[1] || urlMatch[0];
                        tunnelStarted = true;
                        console.log(`🌐 Tunnel URL: ${this.tunnelUrl}`);
                        this.updateWebConfig();
                        resolve(this.tunnelUrl);
                        return;
                    }
                }
            });

            this.tunnelProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error('❌ Ngrok error:', error.trim());
                
                if (error.includes('command not found')) {
                    reject(new Error('Ngrok not installed. Download from: https://ngrok.com/download'));
                } else if (error.includes('authentication failed')) {
                    reject(new Error('Ngrok authentication failed. Please check your auth token.'));
                }
            });

            this.tunnelProcess.on('close', (code) => {
                console.log(`🛑 Ngrok tunnel closed with code ${code}`);
                this.tunnelUrl = null;
                this.tunnelProcess = null;
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (!tunnelStarted) {
                    reject(new Error('Tunnel startup timeout. Please check ngrok installation and auth token.'));
                }
            }, 30000);
        });
    }

    startCloudflareTunnel() {
        return new Promise((resolve, reject) => {
            console.log(`🚇 Starting Cloudflare tunnel on port ${this.serverPort}...`);
            
            const args = ['tunnel', '--url', `localhost:${this.serverPort}`];
            this.tunnelProcess = spawn('cloudflared', args);

            let tunnelStarted = false;

            this.tunnelProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('📡 Cloudflare:', output.trim());

                // Parse cloudflare output to get tunnel URL
                const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
                if (urlMatch && !tunnelStarted) {
                    this.tunnelUrl = urlMatch[0];
                    tunnelStarted = true;
                    console.log(`🌐 Tunnel URL: ${this.tunnelUrl}`);
                    this.updateWebConfig();
                    resolve(this.tunnelUrl);
                }
            });

            this.tunnelProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.error('❌ Cloudflare error:', error.trim());
            });

            this.tunnelProcess.on('close', (code) => {
                console.log(`🛑 Cloudflare tunnel closed with code ${code}`);
                this.tunnelUrl = null;
                this.tunnelProcess = null;
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (!tunnelStarted) {
                    reject(new Error('Tunnel startup timeout. Please check cloudflared installation.'));
                }
            }, 30000);
        });
    }

    updateWebConfig() {
        // Update the web player config with tunnel URL
        const webConfigPath = path.join(__dirname, 'tunnel-url.js');
        const configContent = `
// Auto-generated tunnel configuration
// This file is automatically updated when tunnel starts
window.TUNNEL_CONFIG = {
    baseUrl: '${this.tunnelUrl}',
    audioEndpoint: '${this.tunnelUrl}/audio/',
    authEndpoint: '${this.tunnelUrl}/auth',
    healthEndpoint: '${this.tunnelUrl}/health',
    lastUpdated: '${new Date().toISOString()}'
};

console.log('🔗 Tunnel connected:', window.TUNNEL_CONFIG.baseUrl);
        `.trim();

        try {
            fs.writeFileSync(webConfigPath, configContent);
            console.log('📝 Web configuration updated with tunnel URL');
        } catch (error) {
            console.error('❌ Failed to update web config:', error.message);
        }
    }

    stopTunnel() {
        return new Promise((resolve) => {
            if (this.tunnelProcess) {
                console.log('🛑 Stopping tunnel...');
                this.tunnelProcess.kill('SIGTERM');
                
                this.tunnelProcess.on('close', () => {
                    this.tunnelUrl = null;
                    this.tunnelProcess = null;
                    console.log('✅ Tunnel stopped');
                    resolve();
                });

                // Force kill after 5 seconds
                setTimeout(() => {
                    if (this.tunnelProcess) {
                        this.tunnelProcess.kill('SIGKILL');
                        this.tunnelProcess = null;
                        resolve();
                    }
                }, 5000);
            } else {
                resolve();
            }
        });
    }

    isRunning() {
        return this.tunnelProcess !== null && this.tunnelUrl !== null;
    }

    getStatus() {
        return {
            isRunning: this.isRunning(),
            tunnelUrl: this.tunnelUrl,
            service: this.tunnelService,
            serverPort: this.serverPort
        };
    }

    async testTunnel() {
        if (!this.tunnelUrl) {
            throw new Error('No tunnel URL available');
        }

        return new Promise((resolve, reject) => {
            const testUrl = `${this.tunnelUrl}/health`;
            
            https.get(testUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log('✅ Tunnel health check passed:', response);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid health check response'));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`Tunnel health check failed: ${error.message}`));
            });
        });
    }
}

module.exports = TunnelManager;

// CLI interface if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    const tunnelManager = new TunnelManager({
        serverPort: 3000,
        tunnelService: args.includes('--cloudflare') ? 'cloudflare' : 'ngrok',
        authToken: process.env.NGROK_AUTH_TOKEN,
        subdomain: process.env.NGROK_SUBDOMAIN
    });

    async function runCommand() {
        try {
            switch (command) {
                case 'start':
                    console.log('🚀 Starting tunnel...');
                    const url = await tunnelManager.startTunnel();
                    console.log(`✅ Tunnel started: ${url}`);
                    
                    // Test the tunnel
                    setTimeout(async () => {
                        try {
                            await tunnelManager.testTunnel();
                            console.log('🎵 Ready to serve audio!');
                        } catch (error) {
                            console.error('❌ Tunnel test failed:', error.message);
                        }
                    }, 3000);
                    
                    break;

                case 'stop':
                    await tunnelManager.stopTunnel();
                    break;

                case 'status':
                    console.log('📊 Tunnel status:', tunnelManager.getStatus());
                    break;

                case 'test':
                    await tunnelManager.testTunnel();
                    break;

                default:
                    console.log(`
Usage: node tunnel-setup.js <command> [options]

Commands:
  start              Start the tunnel
  stop               Stop the tunnel
  status             Show tunnel status
  test               Test tunnel connectivity

Options:
  --cloudflare       Use Cloudflare tunnel instead of ngrok
  
Environment Variables:
  NGROK_AUTH_TOKEN   Your ngrok auth token (for custom subdomains)
  NGROK_SUBDOMAIN    Custom subdomain for ngrok

Examples:
  node tunnel-setup.js start
  node tunnel-setup.js start --cloudflare
  NGROK_AUTH_TOKEN=your_token node tunnel-setup.js start
                    `);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    }

    runCommand();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping tunnel...');
        await tunnelManager.stopTunnel();
        process.exit(0);
    });
}
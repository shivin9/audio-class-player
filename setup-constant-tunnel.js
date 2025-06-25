#!/usr/bin/env node

/**
 * Setup script for constant ngrok tunnel URL
 * This script helps you configure a permanent tunnel URL using ngrok's custom subdomain feature
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ConstantTunnelSetup {
    constructor() {
        this.configPath = path.join(__dirname, 'config.js');
        this.tunnelConfigPath = path.join(__dirname, 'tunnel-config.json');
    }

    async setup() {
        console.log('🔧 Setting up constant tunnel URL...\n');

        // Check if ngrok is installed
        await this.checkNgrok();

        // Get auth token from user
        const authToken = await this.getAuthToken();

        // Get preferred subdomain
        const subdomain = await this.getSubdomain();

        // Save configuration
        await this.saveConfig(authToken, subdomain);

        // Update config.js with constant URL
        await this.updateConfigJs(subdomain);

        // Create start script
        await this.createStartScript(authToken, subdomain);

        console.log('\n✅ Constant tunnel setup complete!');
        console.log(`\n🌐 Your constant tunnel URL will be: https://${subdomain}.ngrok-free.app`);
        console.log('\n📝 Next steps:');
        console.log('1. Run: node start-constant-tunnel.js');
        console.log('2. Upload your GitHub Pages site');
        console.log('3. Students can access: https://your-username.github.io/your-repo/\n');
    }

    checkNgrok() {
        return new Promise((resolve, reject) => {
            exec('ngrok --version', (error) => {
                if (error) {
                    console.error('❌ Ngrok not found. Please install from: https://ngrok.com/download');
                    reject(error);
                } else {
                    console.log('✅ Ngrok is installed');
                    resolve();
                }
            });
        });
    }

    async getAuthToken() {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            console.log('🔑 To use a custom subdomain, you need an ngrok auth token.');
            console.log('   1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken');
            console.log('   2. Copy your auth token\n');
            
            readline.question('Enter your ngrok auth token: ', (token) => {
                readline.close();
                resolve(token.trim());
            });
        });
    }

    async getSubdomain() {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            console.log('\n🏷️  Choose a custom subdomain for your tunnel.');
            console.log('   This will be your permanent URL: https://YOUR-SUBDOMAIN.ngrok-free.app');
            console.log('   Suggested: kirtana-classes, audio-player, or your-name-classes\n');
            
            readline.question('Enter your preferred subdomain: ', (subdomain) => {
                readline.close();
                resolve(subdomain.trim().toLowerCase());
            });
        });
    }

    async saveConfig(authToken, subdomain) {
        const config = {
            authToken: authToken,
            subdomain: subdomain,
            tunnelService: 'ngrok',
            constantUrl: `https://${subdomain}.ngrok-free.app`,
            lastUpdated: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.tunnelConfigPath, JSON.stringify(config, null, 2));
            console.log('💾 Tunnel configuration saved');
        } catch (error) {
            console.error('❌ Failed to save config:', error.message);
            throw error;
        }
    }

    async updateConfigJs(subdomain) {
        try {
            let configContent = fs.readFileSync(this.configPath, 'utf8');
            const constantUrl = `https://${subdomain}.ngrok-free.app`;
            
            // Update the baseUrl in config.js
            configContent = configContent.replace(
                /baseUrl: ['"][^'"]*['"],?\s*\/\/ ← Your constant tunnel URL/,
                `baseUrl: '${constantUrl}', // ← Your constant tunnel URL`
            );

            // If the pattern above doesn't match, try a more general pattern
            if (!configContent.includes(constantUrl)) {
                configContent = configContent.replace(
                    /baseUrl: ['"][^'"]*['"]/,
                    `baseUrl: '${constantUrl}'`
                );
            }

            fs.writeFileSync(this.configPath, configContent);
            console.log(`📝 Updated config.js with constant URL: ${constantUrl}`);
        } catch (error) {
            console.error('❌ Failed to update config.js:', error.message);
            throw error;
        }
    }

    async createStartScript(authToken, subdomain) {
        const startScript = `#!/usr/bin/env node

/**
 * Start script for constant tunnel
 * Automatically starts your audio server with the same tunnel URL every time
 */

const { spawn } = require('child_process');
const TunnelManager = require('./tunnel-setup');

class ConstantTunnelManager extends TunnelManager {
    constructor() {
        super({
            serverPort: 3000,
            tunnelService: 'ngrok',
            authToken: '${authToken}',
            subdomain: '${subdomain}'
        });
    }

    async start() {
        console.log('🚀 Starting audio server with constant tunnel...');
        console.log('🌐 Your constant URL: https://${subdomain}.ngrok-free.app\\n');

        try {
            // Start the local audio server
            console.log('📡 Starting local audio server...');
            const serverProcess = spawn('node', ['local-server.js'], {
                stdio: 'inherit'
            });

            // Wait a moment for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Start the tunnel
            console.log('🚇 Starting constant tunnel...');
            const tunnelUrl = await this.startTunnel();
            
            console.log('\\n✅ Everything is running!');
            console.log(\`🌐 Tunnel URL: \${tunnelUrl}\`);
            console.log('🎵 Students can now access your classes via GitHub Pages');
            console.log('\\n⚠️  Keep this terminal open while streaming audio!\\n');

            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\\n🛑 Shutting down...');
                serverProcess.kill();
                await this.stopTunnel();
                process.exit(0);
            });

        } catch (error) {
            console.error('❌ Failed to start:', error.message);
            process.exit(1);
        }
    }
}

// Start the constant tunnel system
const manager = new ConstantTunnelManager();
manager.start();
`;

        const scriptPath = path.join(__dirname, 'start-constant-tunnel.js');
        fs.writeFileSync(scriptPath, startScript);
        
        // Make script executable on Unix systems
        try {
            fs.chmodSync(scriptPath, '755');
        } catch (error) {
            // Ignore chmod errors on Windows
        }

        console.log('📜 Created start-constant-tunnel.js script');
    }
}

// Run the setup if this file is executed directly
if (require.main === module) {
    const setup = new ConstantTunnelSetup();
    setup.setup().catch(error => {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    });
}

module.exports = ConstantTunnelSetup;
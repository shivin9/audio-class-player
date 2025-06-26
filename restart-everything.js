#!/usr/bin/env node

/**
 * Restart Everything
 * Clean restart of audio server and tunnel
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class RestartManager {
    constructor() {
        this.serverProcess = null;
        this.tunnelProcess = null;
        this.tunnelUrl = null;
    }

    async restart() {
        console.log('🔄 Restarting Audio Streaming System...\n');

        try {
            // Step 1: Kill existing processes
            await this.killExistingProcesses();

            // Step 2: Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 3: Start audio server
            await this.startAudioServer();

            // Step 4: Start tunnel
            await this.startTunnel();

            // Step 5: Update config
            this.updateConfig();

            // Step 6: Test everything
            await this.testSystem();

            console.log('\n✅ System restarted successfully!');
            console.log(`🌐 Tunnel URL: ${this.tunnelUrl}`);
            console.log('🎵 Ready to serve audio!');

            // Open HTML for testing
            this.openHtml();

        } catch (error) {
            console.error('❌ Restart failed:', error.message);
            await this.cleanup();
            process.exit(1);
        }
    }

    async killExistingProcesses() {
        console.log('🧹 Stopping existing processes...');
        
        return new Promise((resolve) => {
            exec('pkill -f "local-server.js"; pkill -f "node.*localtunnel"', (error) => {
                // Ignore errors - processes might not exist
                console.log('✅ Existing processes stopped');
                resolve();
            });
        });
    }

    async startAudioServer() {
        return new Promise((resolve, reject) => {
            console.log('🎵 Starting audio server...');
            
            this.serverProcess = spawn('node', ['local-server.js'], {
                stdio: ['inherit', 'pipe', 'pipe']
            });

            let resolved = false;
            
            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Server:', output.trim());
                
                if ((output.includes('listening') || output.includes('running')) && !resolved) {
                    resolved = true;
                    console.log('✅ Audio server started');
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.log('Server Error:', error.trim());
                
                if (error.includes('EADDRINUSE') && !resolved) {
                    resolved = true;
                    reject(new Error('Port 3000 is still in use. Please wait and try again.'));
                }
            });

            // Fallback timeout
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.log('✅ Audio server assumed started');
                    resolve();
                }
            }, 5000);
        });
    }

    async startTunnel() {
        return new Promise((resolve, reject) => {
            console.log('🚇 Starting localtunnel...');
            
            const localtunnel = require('localtunnel');
            
            localtunnel({ port: 3000 }, (err, tunnel) => {
                if (err) {
                    reject(new Error(`Failed to start localtunnel: ${err.message}`));
                    return;
                }
                
                this.tunnelUrl = tunnel.url;
                tunnelFound = true;
                console.log(`✅ Tunnel created: ${this.tunnelUrl}`);
                
                tunnel.on('close', () => {
                    console.log('🛑 Localtunnel closed');
                    this.tunnelProcess = null;
                });
                
                this.tunnelProcess = tunnel;
                resolve();
            });
            
            return;
            
            // Old ngrok code removed
            
            let tunnelFound = false;
            
            // Timeout for localtunnel
            setTimeout(() => {
                if (!tunnelFound) {
                    reject(new Error('Localtunnel startup timeout'));
                }
            }, 30000);
        });
    }

    updateConfig() {
        console.log('📝 Updating configuration files...');
        
        // Update tunnel-url.js
        const tunnelUrlPath = path.join(__dirname, 'tunnel-url.js');
        const configContent = `// Auto-generated tunnel configuration
// This file is automatically updated when tunnel starts
window.TUNNEL_CONFIG = {
    baseUrl: '${this.tunnelUrl}',
    audioEndpoint: '${this.tunnelUrl}/audio/',
    authEndpoint: '${this.tunnelUrl}/auth',
    healthEndpoint: '${this.tunnelUrl}/health',
    lastUpdated: '${new Date().toISOString()}'
};

console.log('🔗 Tunnel connected:', window.TUNNEL_CONFIG.baseUrl);
`;

        fs.writeFileSync(tunnelUrlPath, configContent);
        console.log('✅ Updated tunnel-url.js');
    }

    async testSystem() {
        console.log('🧪 Testing system...');
        
        return new Promise((resolve, reject) => {
            const https = require('https');
            
            https.get(`${this.tunnelUrl}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ System test passed');
                        resolve();
                    } else {
                        reject(new Error(`System test failed: ${res.statusCode}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`System test failed: ${error.message}`));
            });
        });
    }

    openHtml() {
        console.log('\n🌐 Opening web interface...');
        const htmlPath = path.join(__dirname, 'index.html');
        spawn('open', [htmlPath], { detached: true }).unref();
        
        console.log('\n📋 Next steps:');
        console.log('1. Web interface should open in your browser');
        console.log('2. Click "🔍 Debug Tunnel" to verify configuration');
        console.log('3. Try joining an available class');
        console.log('4. Check browser console for any errors');
    }

    async cleanup() {
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
        }
        if (this.tunnelProcess) {
            this.tunnelProcess.kill('SIGTERM');
        }
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    const manager = new RestartManager();
    await manager.cleanup();
    process.exit(0);
});

// Start restart
const manager = new RestartManager();
manager.restart();
#!/usr/bin/env node

/**
 * Test Local Web Interface
 * Starts a simple HTTP server to test the web interface locally
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class LocalWebTester {
    constructor() {
        this.webServer = null;
        this.audioServer = null;
        this.tunnelProcess = null;
        this.webPort = 8080;
        this.audioPort = 3000;
    }

    async start() {
        console.log('🌐 Starting Local Web Test Environment...\n');

        try {
            // Start audio server
            await this.startAudioServer();
            
            // Start web server
            await this.startWebServer();
            
            // Start tunnel
            await this.startTunnel();
            
            console.log('\n✅ Test environment ready!');
            console.log(`🌐 Web interface: http://localhost:${this.webPort}`);
            console.log(`📡 Audio server: http://localhost:${this.audioPort}`);
            console.log('🔍 Check browser console for debug info');
            console.log('\n⚠️  Keep this running while testing...\n');
            
            // Handle shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down test environment...');
                this.cleanup();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Failed to start test environment:', error.message);
            this.cleanup();
            process.exit(1);
        }
    }

    async startAudioServer() {
        return new Promise((resolve, reject) => {
            console.log('📡 Starting audio server...');
            
            this.audioServer = spawn('node', ['local-server.js'], {
                stdio: ['inherit', 'pipe', 'pipe']
            });

            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Audio server startup timeout'));
                }
            }, 10000);

            this.audioServer.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Audio Server:', output.trim());
                
                if (output.includes('listening') || output.includes('running')) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.log('✅ Audio server started');
                        resolve();
                    }
                }
            });

            this.audioServer.stderr.on('data', (data) => {
                console.log('Audio Server Error:', data.toString().trim());
            });

            // Fallback resolve
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.log('✅ Audio server assumed started');
                    resolve();
                }
            }, 3000);
        });
    }

    async startWebServer() {
        return new Promise((resolve, reject) => {
            console.log('🌐 Starting web server...');
            
            this.webServer = http.createServer((req, res) => {
                this.handleWebRequest(req, res);
            });

            this.webServer.listen(this.webPort, () => {
                console.log(`✅ Web server started on http://localhost:${this.webPort}`);
                resolve();
            });

            this.webServer.on('error', (error) => {
                reject(new Error(`Web server failed: ${error.message}`));
            });
        });
    }

    handleWebRequest(req, res) {
        let filePath = req.url === '/' ? '/index.html' : req.url;
        filePath = path.join(__dirname, filePath);

        // Security check
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(__dirname)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };

        const contentType = contentTypes[ext] || 'text/plain';

        // Send file
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    }

    async startTunnel() {
        return new Promise((resolve, reject) => {
            console.log('🚇 Starting ngrok tunnel...');
            
            this.tunnelProcess = spawn('ngrok', ['http', this.audioPort.toString(), '--log=stdout']);
            
            let tunnelFound = false;
            const timeout = setTimeout(() => {
                if (!tunnelFound) {
                    console.log('⚠️ Tunnel startup timeout - continuing without tunnel');
                    resolve();
                }
            }, 20000);

            this.tunnelProcess.stdout.on('data', (data) => {
                const output = data.toString();
                
                // Look for tunnel URL
                const urlPatterns = [
                    /url=(https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app)/,
                    /url=(https:\/\/[a-zA-Z0-9-]+\.ngrok\.io)/,
                    /(https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app)/,
                    /(https:\/\/[a-zA-Z0-9-]+\.ngrok\.io)/
                ];

                for (const pattern of urlPatterns) {
                    const match = output.match(pattern);
                    if (match && !tunnelFound) {
                        const tunnelUrl = match[1] || match[0];
                        tunnelFound = true;
                        console.log(`✅ Tunnel created: ${tunnelUrl}`);
                        this.updateTunnelConfig(tunnelUrl);
                        clearTimeout(timeout);
                        resolve();
                        return;
                    }
                }
            });

            this.tunnelProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (!error.includes('INFO')) {
                    console.log('Tunnel:', error.trim());
                }
            });
        });
    }

    updateTunnelConfig(tunnelUrl) {
        const tunnelUrlPath = path.join(__dirname, 'tunnel-url.js');
        const configContent = `// Auto-generated tunnel configuration
// This file is automatically updated when tunnel starts
window.TUNNEL_CONFIG = {
    baseUrl: '${tunnelUrl}',
    audioEndpoint: '${tunnelUrl}/audio/',
    authEndpoint: '${tunnelUrl}/auth',
    healthEndpoint: '${tunnelUrl}/health',
    lastUpdated: '${new Date().toISOString()}'
};

console.log('🔗 Tunnel connected:', window.TUNNEL_CONFIG.baseUrl);
`;

        try {
            fs.writeFileSync(tunnelUrlPath, configContent);
            console.log('📝 Updated tunnel-url.js with new URL');
        } catch (error) {
            console.error('❌ Failed to update tunnel config:', error.message);
        }
    }

    cleanup() {
        if (this.webServer) {
            this.webServer.close();
        }
        
        if (this.audioServer) {
            this.audioServer.kill('SIGTERM');
        }
        
        if (this.tunnelProcess) {
            this.tunnelProcess.kill('SIGTERM');
        }
    }
}

// Start the test environment
if (require.main === module) {
    const tester = new LocalWebTester();
    tester.start();
}

module.exports = LocalWebTester;
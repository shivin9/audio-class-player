#!/usr/bin/env node

/**
 * Test Full System
 * Tests the complete audio streaming workflow
 */

const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

class SystemTester {
    constructor() {
        this.serverProcess = null;
        this.tunnelProcess = null;
        this.tunnelUrl = null;
    }

    async runFullTest() {
        console.log('🧪 Testing Full Audio Streaming System...\n');

        try {
            // Step 1: Check audio files exist
            await this.checkAudioFiles();

            // Step 2: Start local server
            await this.startServer();

            // Step 3: Test local server
            await this.testLocalServer();

            // Step 4: Start tunnel
            await this.startTunnel();

            // Step 5: Test tunnel connection
            await this.testTunnelConnection();

            // Step 6: Test audio streaming through tunnel
            await this.testAudioStreaming();

            // Step 7: Check web configuration
            await this.checkWebConfig();

            console.log('\n✅ All tests passed! System is working correctly.');
            
        } catch (error) {
            console.error(`\n❌ Test failed: ${error.message}`);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    async checkAudioFiles() {
        console.log('📁 Checking audio files...');
        
        const audioDir = path.join(__dirname, 'audio');
        const audioFiles = ['Hare Krsna Kirtana.mp3', '74. Elements of Akarma 1 (29.11.20).mp3'];
        
        if (!fs.existsSync(audioDir)) {
            throw new Error('Audio directory not found');
        }

        for (const file of audioFiles) {
            const filePath = path.join(audioDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Audio file not found: ${file}`);
            }
        }
        
        console.log('✅ Audio files found');
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            console.log('🖥️ Starting local server...');
            
            this.serverProcess = spawn('node', ['local-server.js'], {
                stdio: ['inherit', 'pipe', 'pipe']
            });

            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Server startup timeout'));
                }
            }, 10000);

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('Server:', output.trim());
                
                if (output.includes('listening') || output.includes('running')) {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        console.log('✅ Local server started');
                        resolve();
                    }
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                console.log('Server Error:', data.toString().trim());
            });

            // Fallback - resolve after 3 seconds
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    console.log('✅ Local server assumed started');
                    resolve();
                }
            }, 3000);
        });
    }

    async testLocalServer() {
        console.log('🔍 Testing local server...');
        
        return new Promise((resolve, reject) => {
            const req = require('http').get('http://localhost:3000/health', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Local server responding');
                        resolve();
                    } else {
                        reject(new Error(`Server health check failed: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Local server connection failed: ${error.message}`));
            });

            req.setTimeout(5000, () => {
                reject(new Error('Local server connection timeout'));
            });
        });
    }

    async startTunnel() {
        return new Promise((resolve, reject) => {
            console.log('🚇 Starting ngrok tunnel...');
            
            this.tunnelProcess = spawn('ngrok', ['http', '3000', '--log=stdout']);
            
            let tunnelFound = false;
            const timeout = setTimeout(() => {
                if (!tunnelFound) {
                    reject(new Error('Tunnel startup timeout'));
                }
            }, 30000);

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
                        this.tunnelUrl = match[1] || match[0];
                        tunnelFound = true;
                        console.log(`✅ Tunnel created: ${this.tunnelUrl}`);
                        clearTimeout(timeout);
                        resolve();
                        return;
                    }
                }
            });

            this.tunnelProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.log('Tunnel:', error.trim());
            });
        });
    }

    async testTunnelConnection() {
        if (!this.tunnelUrl) {
            throw new Error('No tunnel URL available');
        }

        console.log('🌐 Testing tunnel connection...');
        
        return new Promise((resolve, reject) => {
            const url = `${this.tunnelUrl}/health`;
            
            const req = https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Tunnel connection working');
                        resolve();
                    } else {
                        reject(new Error(`Tunnel health check failed: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Tunnel connection failed: ${error.message}`));
            });

            req.setTimeout(10000, () => {
                reject(new Error('Tunnel connection timeout'));
            });
        });
    }

    async testAudioStreaming() {
        console.log('🎵 Testing audio streaming...');
        
        return new Promise((resolve, reject) => {
            // First get auth token
            const authUrl = `${this.tunnelUrl}/auth`;
            const postData = JSON.stringify({
                classId: 'test-class',
                studentId: 'test-student'
            });

            const authReq = https.request(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (authRes) => {
                let authData = '';
                authRes.on('data', chunk => authData += chunk);
                authRes.on('end', () => {
                    try {
                        const authResponse = JSON.parse(authData);
                        if (authResponse.token) {
                            this.testAudioDownload(authResponse.token, resolve, reject);
                        } else {
                            reject(new Error('No auth token received'));
                        }
                    } catch (error) {
                        reject(new Error(`Auth response parsing failed: ${error.message}`));
                    }
                });
            });

            authReq.on('error', (error) => {
                reject(new Error(`Auth request failed: ${error.message}`));
            });

            authReq.write(postData);
            authReq.end();
        });
    }

    testAudioDownload(token, resolve, reject) {
        const audioUrl = `${this.tunnelUrl}/audio/Hare%20Krsna%20Kirtana.mp3?token=${token}`;
        
        const req = https.get(audioUrl, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Audio streaming working');
                req.destroy(); // Don't download the whole file
                resolve();
            } else {
                reject(new Error(`Audio request failed: ${res.statusCode}`));
            }
        });

        req.on('error', (error) => {
            reject(new Error(`Audio request failed: ${error.message}`));
        });

        req.setTimeout(10000, () => {
            reject(new Error('Audio request timeout'));
        });
    }

    async checkWebConfig() {
        console.log('🔧 Checking web configuration...');
        
        // Check if tunnel-url.js exists and is updated
        const tunnelUrlPath = path.join(__dirname, 'tunnel-url.js');
        if (fs.existsSync(tunnelUrlPath)) {
            const content = fs.readFileSync(tunnelUrlPath, 'utf8');
            if (content.includes(this.tunnelUrl)) {
                console.log('✅ tunnel-url.js is up to date');
            } else {
                console.log('⚠️ tunnel-url.js may need updating');
            }
        } else {
            console.log('⚠️ tunnel-url.js not found');
        }

        // Check config.js
        const configPath = path.join(__dirname, 'config.js');
        if (fs.existsSync(configPath)) {
            console.log('✅ config.js found');
        } else {
            throw new Error('config.js not found');
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        if (this.tunnelProcess) {
            this.tunnelProcess.kill('SIGTERM');
        }
        
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
        }

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Run the test
if (require.main === module) {
    const tester = new SystemTester();
    tester.runFullTest().catch(error => {
        console.error('Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = SystemTester;
#!/usr/bin/env node

/**
 * Auto-Deploy Script for Tunnel Audio Streaming
 * 
 * This script:
 * 1. Starts the local audio server
 * 2. Creates ngrok tunnel and gets the random URL
 * 3. Updates config files with the new tunnel URL
 * 4. Commits and pushes changes to GitHub
 * 5. Students always get the latest tunnel URL from GitHub Pages
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoDeployManager {
    constructor() {
        this.serverProcess = null;
        this.tunnelProcess = null;
        this.tunnelUrl = null;
        this.isDeploying = false;
    }

    async start() {
        console.log('🚀 Starting Auto-Deploy Audio Streaming System...\n');

        try {
            // Check if we're in a git repository
            await this.checkGitRepo();

            // Start local server
            await this.startLocalServer();

            // Start tunnel and get URL
            await this.startTunnelAndCapture();

            // Update config files
            await this.updateConfigFiles();

            // Deploy to GitHub
            await this.deployToGitHub();

            console.log('\n✅ Auto-deploy complete!');
            console.log(`🌐 Tunnel URL: ${this.tunnelUrl}`);
            console.log('📱 Students can access your classes at your GitHub Pages URL');
            console.log('\n⚠️  Keep this terminal open while streaming audio!\n');

            // Set up graceful shutdown
            this.setupShutdownHandlers();

        } catch (error) {
            console.error('❌ Auto-deploy failed:', error.message);
            await this.cleanup();
            process.exit(1);
        }
    }

    async checkGitRepo() {
        return new Promise((resolve, reject) => {
            exec('git status', (error) => {
                if (error) {
                    reject(new Error('Not in a Git repository. Please run "git init" and set up your GitHub repo first.'));
                } else {
                    console.log('✅ Git repository detected');
                    resolve();
                }
            });
        });
    }

    async startLocalServer() {
        return new Promise((resolve) => {
            console.log('📡 Starting local audio server...');
            
            this.serverProcess = spawn('node', ['local-server.js'], {
                stdio: ['inherit', 'pipe', 'pipe']
            });

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Server running') || output.includes('listening')) {
                    console.log('✅ Local server started');
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                console.log('Server:', data.toString().trim());
            });

            // Resolve after 3 seconds even if no specific message
            setTimeout(resolve, 3000);
        });
    }

    async startTunnelAndCapture() {
        return new Promise((resolve, reject) => {
            console.log('🚇 Starting ngrok tunnel...');
            
            this.tunnelProcess = spawn('ngrok', ['http', '3000', '--log=stdout']);
            
            let tunnelFound = false;
            const timeout = setTimeout(() => {
                if (!tunnelFound) {
                    reject(new Error('Tunnel startup timeout - ngrok may not be installed or configured'));
                }
            }, 30000);

            this.tunnelProcess.stdout.on('data', (data) => {
                const output = data.toString();
                
                // Look for tunnel URL in ngrok output
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
                
                if (error.includes('command not found')) {
                    clearTimeout(timeout);
                    reject(new Error('Ngrok not installed. Please install from: https://ngrok.com/download'));
                } else if (error.includes('authentication failed')) {
                    clearTimeout(timeout);
                    reject(new Error('Ngrok authentication failed. You can use the free version without auth token.'));
                }
            });
        });
    }

    async updateConfigFiles() {
        console.log('📝 Updating config files with new tunnel URL...');
        
        // Update tunnel-url.js
        await this.updateTunnelUrlJs();
        
        // Update config.js tunnel section
        await this.updateConfigJs();
        
        console.log('✅ Config files updated');
    }

    async updateTunnelUrlJs() {
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
    }

    async updateConfigJs() {
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');

        // Update the tunnel baseUrl in config.js with multiple patterns
        const patterns = [
            // Pattern 1: With comment variations
            [/baseUrl: ['"][^'"]*['"],?\s*\/\/ Will be set to current tunnel URL/, `baseUrl: '${this.tunnelUrl}', // Will be set to current tunnel URL`],
            [/baseUrl: ['"][^'"]*['"],?\s*\/\/ ← Auto-updated tunnel URL/, `baseUrl: '${this.tunnelUrl}', // ← Auto-updated tunnel URL`],
            [/baseUrl: ['"][^'"]*['"],?\s*\/\/ ← Your constant tunnel URL/, `baseUrl: '${this.tunnelUrl}', // ← Auto-updated tunnel URL`],
            // Pattern 2: General tunnel baseUrl pattern
            [/(tunnel:\s*{[^}]*baseUrl:\s*)['"][^'"]*['"]/, `$1'${this.tunnelUrl}'`],
            // Pattern 3: Simple baseUrl pattern in tunnel section
            [/(\/\/ This gets automatically updated by auto-deploy\.js or start-streaming\.js[\s\S]*?baseUrl:\s*)['"][^'"]*['"]/, `$1'${this.tunnelUrl}'`]
        ];

        let updated = false;
        for (const [pattern, replacement] of patterns) {
            if (pattern.test(configContent)) {
                configContent = configContent.replace(pattern, replacement);
                updated = true;
                console.log('✅ Updated config.js tunnel URL');
                break;
            }
        }

        if (!updated) {
            console.log('⚠️ Could not update config.js tunnel URL - manual update may be needed');
        }

        fs.writeFileSync(configPath, configContent);
    }

    async deployToGitHub() {
        this.isDeploying = true;
        console.log('🚀 Deploying to GitHub...');

        try {
            // Add all changes
            await this.runGitCommand('git add .');
            
            // Create commit with timestamp
            const timestamp = new Date().toLocaleString();
            const commitMessage = `Auto-deploy: Update tunnel URL (${timestamp})

🔗 New tunnel URL: ${this.tunnelUrl}

🤖 Generated with Claude Code
https://claude.ai/code

Co-Authored-By: Claude <noreply@anthropic.com>`;
            
            await this.runGitCommand(`git commit -m "${commitMessage}"`);
            
            // Push to GitHub
            await this.runGitCommand('git push');
            
            console.log('✅ Successfully deployed to GitHub!');
            
        } catch (error) {
            if (error.message.includes('nothing to commit')) {
                console.log('ℹ️ No changes to deploy');
            } else {
                throw error;
            }
        } finally {
            this.isDeploying = false;
        }
    }

    async runGitCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Git command failed: ${error.message}`));
                } else {
                    if (stdout) console.log(stdout.trim());
                    if (stderr) console.log(stderr.trim());
                    resolve(stdout);
                }
            });
        });
    }

    setupShutdownHandlers() {
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            await this.cleanup();
            process.exit(0);
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', async (error) => {
            console.error('❌ Uncaught exception:', error.message);
            await this.cleanup();
            process.exit(1);
        });
    }

    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        if (this.tunnelProcess) {
            this.tunnelProcess.kill('SIGTERM');
            this.tunnelProcess = null;
        }
        
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
        }

        // Wait a moment for processes to terminate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Cleanup complete');
    }

    // Method to update tunnel URL while running (in case tunnel changes)
    async updateTunnel(newUrl) {
        if (this.isDeploying) {
            console.log('⏳ Deployment in progress, skipping update...');
            return;
        }

        console.log(`🔄 Updating tunnel URL to: ${newUrl}`);
        this.tunnelUrl = newUrl;
        
        await this.updateConfigFiles();
        await this.deployToGitHub();
        
        console.log('✅ Tunnel URL updated and deployed!');
    }
}

// Start the auto-deploy system
if (require.main === module) {
    const manager = new AutoDeployManager();
    manager.start().catch(error => {
        console.error('❌ Failed to start auto-deploy:', error.message);
        process.exit(1);
    });
}

module.exports = AutoDeployManager;
#!/usr/bin/env node

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
            authToken: '2yzraYFA58F8FbR5LlcgZ4ofZXj_7moVc4LaTSuRev7uFBdtR',
            subdomain: 'bg-class'
        });
    }

    async start() {
        console.log('🚀 Starting audio server with constant tunnel...');
        console.log('🌐 Your constant URL: https://bg-class.ngrok-free.app\n');

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
            
            console.log('\n✅ Everything is running!');
            console.log(`🌐 Tunnel URL: ${tunnelUrl}`);
            console.log('🎵 Students can now access your classes via GitHub Pages');
            console.log('\n⚠️  Keep this terminal open while streaming audio!\n');

            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down...');
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

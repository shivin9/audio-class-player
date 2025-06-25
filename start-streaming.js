#!/usr/bin/env node

/**
 * Complete Audio Streaming Startup Script
 * Starts local server + secure tunnel for streaming audio to students
 */

const SecureAudioServer = require('./local-server');
const TunnelManager = require('./tunnel-setup');
const path = require('path');
const fs = require('fs');

class AudioStreamingService {
    constructor() {
        this.server = null;
        this.tunnel = null;
        this.isRunning = false;
    }

    async start(options = {}) {
        try {
            console.log('🎵 Starting Kirtana Audio Streaming Service...');
            console.log('===============================================\n');

            // Step 1: Start local server
            console.log('📡 Step 1: Starting local audio server...');
            this.server = new SecureAudioServer({
                port: options.port || 3000,
                audioDirectory: options.audioDirectory || path.join(__dirname, 'audio'),
                maxConcurrentStreams: options.maxStreams || 50,
                tokenExpiryMinutes: options.tokenExpiry || 60
            });

            await this.server.start();
            this.server.startTokenCleanup();

            // Check if audio files exist
            const audioDir = this.server.audioDirectory;
            const audioFiles = this.getAudioFiles(audioDir);
            
            if (audioFiles.length === 0) {
                console.log('⚠️  Warning: No audio files found in audio directory');
                console.log(`📁 Please add MP3 files to: ${audioDir}`);
            } else {
                console.log(`🎵 Found ${audioFiles.length} audio file(s):`);
                audioFiles.forEach(file => console.log(`   • ${file}`));
            }

            console.log('');

            // Step 2: Start tunnel
            console.log('🚇 Step 2: Creating secure tunnel...');
            this.tunnel = new TunnelManager({
                serverPort: this.server.port,
                tunnelService: options.tunnelService || 'ngrok',
                authToken: options.authToken,
                subdomain: options.subdomain
            });

            const tunnelUrl = await this.tunnel.startTunnel();
            
            // Step 3: Test connection
            console.log('');
            console.log('🧪 Step 3: Testing connection...');
            await this.tunnel.testTunnel();

            console.log('');
            console.log('✅ SUCCESS! Audio streaming service is ready!');
            console.log('============================================');
            console.log('');
            console.log('🌐 Your students can access classes at:');
            console.log(`   ${tunnelUrl}`);
            console.log('');
            console.log('📊 Service Information:');
            console.log(`   • Local Server: http://localhost:${this.server.port}`);
            console.log(`   • Tunnel URL: ${tunnelUrl}`);
            console.log(`   • Audio Directory: ${audioDir}`);
            console.log(`   • Max Concurrent Streams: ${this.server.maxConcurrentStreams}`);
            console.log(`   • Token Expiry: ${this.server.tokenExpiryMinutes} minutes`);
            console.log('');
            console.log('🎯 Next Steps:');
            console.log('   1. Update your GitHub Pages config.js with the tunnel URL');
            console.log('   2. Share the GitHub Pages URL with your students');
            console.log('   3. Students will be able to stream audio directly from your computer');
            console.log('');
            console.log('⏹️  Press Ctrl+C to stop the service');

            this.isRunning = true;

            // Monitor service health
            this.startHealthMonitoring();

            return {
                serverPort: this.server.port,
                tunnelUrl: tunnelUrl,
                audioFiles: audioFiles.length
            };

        } catch (error) {
            console.error('❌ Failed to start streaming service:', error.message);
            await this.stop();
            throw error;
        }
    }

    getAudioFiles(audioDir) {
        try {
            return fs.readdirSync(audioDir)
                    .filter(file => /\.(mp3|wav|m4a|ogg)$/i.test(file))
                    .sort();
        } catch (error) {
            return [];
        }
    }

    startHealthMonitoring() {
        // Check health every 30 seconds
        setInterval(async () => {
            if (!this.isRunning) return;

            try {
                const serverStats = this.server.getStats();
                const tunnelStatus = this.tunnel.getStatus();

                if (serverStats.activeStreams > 0) {
                    console.log(`📊 ${serverStats.activeStreams} active stream(s), ${serverStats.authorizedTokens} authorized tokens`);
                }

                if (!tunnelStatus.isRunning) {
                    console.log('⚠️  Tunnel disconnected, attempting to reconnect...');
                    await this.tunnel.startTunnel();
                }
            } catch (error) {
                console.log('⚠️  Health check issue:', error.message);
            }
        }, 30000);
    }

    async stop() {
        console.log('🛑 Stopping audio streaming service...');
        this.isRunning = false;

        if (this.tunnel) {
            await this.tunnel.stopTunnel();
        }

        if (this.server) {
            await this.server.stop();
        }

        console.log('✅ Service stopped');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            server: this.server ? this.server.getStats() : null,
            tunnel: this.tunnel ? this.tunnel.getStatus() : null
        };
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    // Parse arguments
    const options = {
        port: 3000,
        tunnelService: 'ngrok',
        audioDirectory: path.join(__dirname, 'audio'),
        maxStreams: 50,
        tokenExpiry: 60
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
                options.port = parseInt(args[++i]);
                break;
            case '--cloudflare':
                options.tunnelService = 'cloudflare';
                break;
            case '--ngrok':
                options.tunnelService = 'ngrok';
                break;
            case '--auth-token':
                options.authToken = args[++i];
                break;
            case '--subdomain':
                options.subdomain = args[++i];
                break;
            case '--audio-dir':
                options.audioDirectory = args[++i];
                break;
            case '--max-streams':
                options.maxStreams = parseInt(args[++i]);
                break;
            case '--token-expiry':
                options.tokenExpiry = parseInt(args[++i]);
                break;
            case '--help':
                console.log(`
🎵 Kirtana Audio Streaming Service

Usage: node start-streaming.js [options]

Options:
  --port <number>          Local server port (default: 3000)
  --cloudflare            Use Cloudflare tunnel (default: ngrok)
  --ngrok                 Use ngrok tunnel
  --auth-token <token>    Ngrok auth token (for custom subdomains)
  --subdomain <name>      Custom subdomain for ngrok
  --audio-dir <path>      Audio files directory (default: ./audio)
  --max-streams <number>  Max concurrent streams (default: 50)
  --token-expiry <mins>   Token expiry in minutes (default: 60)
  --help                  Show this help

Environment Variables:
  NGROK_AUTH_TOKEN       Your ngrok auth token
  NGROK_SUBDOMAIN        Custom subdomain for ngrok

Examples:
  node start-streaming.js
  node start-streaming.js --cloudflare
  node start-streaming.js --port 8080 --max-streams 100
  NGROK_AUTH_TOKEN=your_token node start-streaming.js --subdomain kirtana

Prerequisites:
  • Node.js installed
  • ngrok or cloudflared installed
  • Audio files in the audio/ directory
                `);
                process.exit(0);
        }
    }

    // Use environment variables if available
    options.authToken = options.authToken || process.env.NGROK_AUTH_TOKEN;
    options.subdomain = options.subdomain || process.env.NGROK_SUBDOMAIN;

    const service = new AudioStreamingService();

    try {
        await service.start(options);

        // Keep the process running
        process.stdin.resume();

    } catch (error) {
        console.error('❌ Service failed to start:', error.message);
        process.exit(1);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received shutdown signal...');
        await service.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received termination signal...');
        await service.stop();
        process.exit(0);
    });
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = AudioStreamingService;
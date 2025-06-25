/**
 * Local Audio Server with Secure Tunnel Support
 * Serves audio files from your local computer to students over the internet
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

class SecureAudioServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.audioDirectory = options.audioDirectory || path.join(__dirname, 'audio');
        this.secretKey = options.secretKey || this.generateSecretKey();
        this.authorizedTokens = new Map();
        this.activeStreams = new Map();
        this.server = null;
        
        // Security settings
        this.maxConcurrentStreams = options.maxConcurrentStreams || 50;
        this.tokenExpiryMinutes = options.tokenExpiryMinutes || 60;
        this.allowedOrigins = options.allowedOrigins || ['*'];
        
        this.setupServer();
    }

    generateSecretKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    setupServer() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.on('error', (err) => {
            console.error('❌ Server error:', err);
        });
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;

        // Enable CORS
        this.setCORSHeaders(res, req);

        // Handle preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            if (pathname === '/health') {
                this.handleHealthCheck(res);
            } else if (pathname === '/auth') {
                this.handleAuthentication(req, res);
            } else if (pathname.startsWith('/audio/')) {
                await this.handleAudioRequest(req, res, pathname, query);
            } else if (pathname === '/config') {
                this.handleConfigRequest(res);
            } else {
                this.send404(res);
            }
        } catch (error) {
            console.error('❌ Request error:', error);
            this.send500(res, error.message);
        }
    }

    setCORSHeaders(res, req) {
        const origin = req.headers.origin;
        
        if (this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }

    handleHealthCheck(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            activeStreams: this.activeStreams.size,
            uptime: process.uptime()
        }));
    }

    handleAuthentication(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { classId, studentId } = JSON.parse(body);
                
                if (!classId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Class ID required' }));
                    return;
                }

                // Generate secure token
                const token = this.generateAccessToken(classId, studentId);
                const expiryTime = Date.now() + (this.tokenExpiryMinutes * 60 * 1000);
                
                this.authorizedTokens.set(token, {
                    classId,
                    studentId: studentId || 'anonymous',
                    createdAt: Date.now(),
                    expiresAt: expiryTime,
                    accessCount: 0
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    token,
                    expiresAt: expiryTime,
                    message: 'Authentication successful'
                }));

                console.log(`🔑 Token generated for class: ${classId}, student: ${studentId || 'anonymous'}`);
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
        });
    }

    generateAccessToken(classId, studentId) {
        const payload = `${classId}:${studentId}:${Date.now()}`;
        const hash = crypto.createHmac('sha256', this.secretKey)
                          .update(payload)
                          .digest('hex');
        return `${Buffer.from(payload).toString('base64')}.${hash}`;
    }

    verifyToken(token) {
        if (!this.authorizedTokens.has(token)) {
            return { valid: false, reason: 'Token not found' };
        }

        const tokenData = this.authorizedTokens.get(token);
        
        if (Date.now() > tokenData.expiresAt) {
            this.authorizedTokens.delete(token);
            return { valid: false, reason: 'Token expired' };
        }

        return { valid: true, data: tokenData };
    }

    async handleAudioRequest(req, res, pathname, query) {
        const token = req.headers['x-auth-token'] || query.token;
        
        if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication token required' }));
            return;
        }

        const tokenVerification = this.verifyToken(token);
        if (!tokenVerification.valid) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: tokenVerification.reason }));
            return;
        }

        // Extract filename from path
        const filename = decodeURIComponent(pathname.replace('/audio/', ''));
        const filePath = path.join(this.audioDirectory, filename);
        
        // Security check: ensure file is within audio directory
        const normalizedPath = path.normalize(filePath);
        const normalizedAudioDir = path.normalize(this.audioDirectory);
        
        if (!normalizedPath.startsWith(normalizedAudioDir)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access denied' }));
            return;
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Audio file not found' }));
            return;
        }

        // Check concurrent streams limit
        if (this.activeStreams.size >= this.maxConcurrentStreams) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Too many concurrent streams' }));
            return;
        }

        await this.streamAudioFile(filePath, req, res, tokenVerification.data);
    }

    async streamAudioFile(filePath, req, res, tokenData) {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        // Generate stream ID
        const streamId = crypto.randomUUID();
        
        // Track active stream
        this.activeStreams.set(streamId, {
            classId: tokenData.classId,
            studentId: tokenData.studentId,
            startTime: Date.now(),
            filePath
        });

        // Update token access count
        tokenData.accessCount++;

        console.log(`🎵 Streaming: ${path.basename(filePath)} to ${tokenData.studentId} (Stream ID: ${streamId})`);

        if (range) {
            // Handle range requests for seeking
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            const stream = fs.createReadStream(filePath, { start, end });
            
            stream.on('error', (error) => {
                console.error('❌ Stream error:', error);
                this.activeStreams.delete(streamId);
            });

            stream.on('end', () => {
                this.activeStreams.delete(streamId);
                console.log(`✅ Stream completed: ${streamId}`);
            });

            stream.pipe(res);
        } else {
            // Stream entire file
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            const stream = fs.createReadStream(filePath);
            
            stream.on('error', (error) => {
                console.error('❌ Stream error:', error);
                this.activeStreams.delete(streamId);
            });

            stream.on('end', () => {
                this.activeStreams.delete(streamId);
                console.log(`✅ Stream completed: ${streamId}`);
            });

            stream.pipe(res);
        }

        // Clean up on client disconnect
        req.on('close', () => {
            this.activeStreams.delete(streamId);
            console.log(`🔌 Client disconnected: ${streamId}`);
        });
    }

    handleConfigRequest(res) {
        // Return available audio files (for debugging/admin)
        try {
            const files = fs.readdirSync(this.audioDirectory)
                          .filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a'))
                          .map(file => ({
                              name: file,
                              path: `/audio/${encodeURIComponent(file)}`,
                              size: fs.statSync(path.join(this.audioDirectory, file)).size
                          }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                audioFiles: files,
                serverInfo: {
                    uptime: process.uptime(),
                    activeStreams: this.activeStreams.size,
                    authorizedTokens: this.authorizedTokens.size
                }
            }));
        } catch (error) {
            this.send500(res, error.message);
        }
    }

    send404(res) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }

    send500(res, message) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message }));
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🎵 Secure Audio Server running on port ${this.port}`);
                    console.log(`📁 Serving audio from: ${this.audioDirectory}`);
                    console.log(`🔑 Secret key: ${this.secretKey.substring(0, 8)}...`);
                    resolve();
                }
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 Server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Cleanup expired tokens periodically
    startTokenCleanup() {
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            
            for (const [token, data] of this.authorizedTokens.entries()) {
                if (now > data.expiresAt) {
                    this.authorizedTokens.delete(token);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`🧹 Cleaned up ${cleanedCount} expired tokens`);
            }
        }, 5 * 60 * 1000); // Clean up every 5 minutes
    }

    getStats() {
        return {
            uptime: process.uptime(),
            activeStreams: this.activeStreams.size,
            authorizedTokens: this.authorizedTokens.size,
            port: this.port,
            audioDirectory: this.audioDirectory
        };
    }
}

module.exports = SecureAudioServer;

// If run directly
if (require.main === module) {
    const server = new SecureAudioServer({
        port: 3000,
        audioDirectory: path.join(__dirname, 'audio'),
        maxConcurrentStreams: 50,
        tokenExpiryMinutes: 60
    });

    server.start()
        .then(() => {
            server.startTokenCleanup();
            console.log('✅ Server started successfully');
            console.log('🌐 Ready for tunnel connection');
        })
        .catch(error => {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('🛑 Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('🛑 Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
    });
}
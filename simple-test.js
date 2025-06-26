#!/usr/bin/env node

/**
 * Simple Test - Just open the HTML file in browser with tunnel URL
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Simple Test: Open HTML with current tunnel URL\n');

// Check if tunnel-url.js exists
const tunnelUrlPath = path.join(__dirname, 'tunnel-url.js');
if (fs.existsSync(tunnelUrlPath)) {
    const content = fs.readFileSync(tunnelUrlPath, 'utf8');
    console.log('📄 Current tunnel-url.js content:');
    console.log(content);
    
    // Extract tunnel URL
    const match = content.match(/baseUrl: '([^']+)'/);
    if (match) {
        const tunnelUrl = match[1];
        console.log(`\n🔗 Tunnel URL: ${tunnelUrl}`);
        
        // Test tunnel health
        console.log('\n🏥 Testing tunnel health...');
        const https = require('https');
        
        https.get(`${tunnelUrl}/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Tunnel is responding!');
                    console.log('📋 Response:', data);
                } else {
                    console.log('❌ Tunnel health check failed:', res.statusCode);
                    console.log('📋 Response:', data);
                }
                
                // Now open the HTML file
                openHtmlFile();
            });
        }).on('error', (error) => {
            console.log('❌ Tunnel connection failed:', error.message);
            openHtmlFile();
        });
    } else {
        console.log('⚠️ Could not extract tunnel URL from file');
        openHtmlFile();
    }
} else {
    console.log('❌ tunnel-url.js not found');
    openHtmlFile();
}

function openHtmlFile() {
    const htmlPath = path.join(__dirname, 'index.html');
    console.log(`\n🌐 Opening HTML file: ${htmlPath}`);
    
    // Open in default browser (macOS)
    const opener = spawn('open', [htmlPath], { detached: true });
    opener.unref();
    
    console.log('\n📝 Instructions:');
    console.log('1. Check browser console for debug messages');
    console.log('2. Click the "🔍 Debug Tunnel" button');
    console.log('3. Look for tunnel configuration errors');
    console.log('4. Try clicking "Join Class" on an available class');
    
    console.log('\n🔍 Common issues to check:');
    console.log('- Is the tunnel URL in tunnel-url.js valid?');
    console.log('- Is the local audio server running on port 3000?');
    console.log('- Are there any JavaScript errors in browser console?');
}
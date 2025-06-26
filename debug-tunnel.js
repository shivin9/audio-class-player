/**
 * Debug Tunnel Configuration
 * Add this script to check tunnel configuration loading in browser console
 */

function debugTunnelConfig() {
    console.log('🔍 Debug: Tunnel Configuration Check');
    console.log('=====================================');
    
    // Check if config.js loaded
    console.log('1. AUDIO_CONFIG loaded:', !!window.AUDIO_CONFIG);
    if (window.AUDIO_CONFIG) {
        console.log('   - tunnel section:', window.AUDIO_CONFIG.tunnel);
        console.log('   - tunnel baseUrl:', window.AUDIO_CONFIG.tunnel?.baseUrl);
    }
    
    // Check if tunnel-url.js loaded
    console.log('2. TUNNEL_CONFIG loaded:', !!window.TUNNEL_CONFIG);
    if (window.TUNNEL_CONFIG) {
        console.log('   - baseUrl:', window.TUNNEL_CONFIG.baseUrl);
        console.log('   - lastUpdated:', window.TUNNEL_CONFIG.lastUpdated);
    }
    
    // Check tunnel audio manager
    console.log('3. tunnelAudioManager:', !!window.tunnelAudioManager);
    if (window.tunnelAudioManager) {
        console.log('   - tunnelConfig:', window.tunnelAudioManager.tunnelConfig);
        console.log('   - isConnected:', window.tunnelAudioManager.isConnected);
        console.log('   - authToken:', !!window.tunnelAudioManager.authToken);
    }
    
    // Check current class
    console.log('4. Current class:', window.getCurrentClass?.());
    
    // Check scheduler
    console.log('5. audioScheduler:', !!window.audioScheduler);
    if (window.audioScheduler) {
        console.log('   - selectedClassId:', window.audioScheduler.selectedClassId);
        console.log('   - currentClass:', window.audioScheduler.currentClass);
    }
    
    console.log('=====================================');
    
    // Test tunnel connection if available
    if (window.tunnelAudioManager && window.tunnelAudioManager.tunnelConfig) {
        console.log('🧪 Testing tunnel connection...');
        window.tunnelAudioManager.testConnection().then(success => {
            console.log('✅ Tunnel connection test:', success ? 'PASSED' : 'FAILED');
        }).catch(error => {
            console.log('❌ Tunnel connection test FAILED:', error.message);
        });
    }
}

// Auto-run debug on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        debugTunnelConfig();
        
        // Also add debug button to page
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🔍 Debug Tunnel';
        debugBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        debugBtn.onclick = debugTunnelConfig;
        document.body.appendChild(debugBtn);
        
    }, 2000);
});

// Export for manual use
window.debugTunnelConfig = debugTunnelConfig;
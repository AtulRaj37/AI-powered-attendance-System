const localtunnel = require('localtunnel');

(async () => {
    try {
        // Expose Backend API
        const backendTunnel = await localtunnel({ port: 8000, subdomain: 'aiattend-api' });
        console.log(`\n======================================================`);
        console.log(`🚀 [BACKEND] is LIVE globally at -> ${backendTunnel.url}`);
        
        // Expose Frontend React App
        const frontendTunnel = await localtunnel({ port: 5173, subdomain: 'aiattend-app' });
        console.log(`🚀 [FRONTEND] is LIVE globally at -> ${frontendTunnel.url}`);
        console.log(`======================================================\n`);
        
        console.log(`[INSTRUCTIONS FOR YOUR FRIEND]`);
        console.log(`1. Keep this terminal open! If you close it, the links break.`);
        console.log(`2. Tell your friend to open their browser and go to: ${frontendTunnel.url}`);
        console.log(`3. When they click 'Login', the app will securely hit: ${backendTunnel.url}\n`);

        const handleReconnect = async (tunnelName) => {
            console.log(`\n[WARNING] ${tunnelName} Tunnel Closed. Attempting to reconnect in 5 seconds...`);
            setTimeout(() => {
                console.log(`Restarting tunnels. Please manually kill (Ctrl+C) and run 'node share.js' again if it fails to automatically recover.`);
            }, 5000);
        };

        backendTunnel.on('close', () => handleReconnect("BACKEND API"));
        frontendTunnel.on('close', () => handleReconnect("FRONTEND APP"));
        backendTunnel.on('error', (err) => console.log('Backend Tunnel Error:', err));
        frontendTunnel.on('error', (err) => console.log('Frontend Tunnel Error:', err));

    } catch (err) {
        console.error("Failed to start global tunnels:", err);
    }
})();

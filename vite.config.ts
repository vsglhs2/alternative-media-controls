import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        allowedHosts: ['c144-103-155-232-207.ngrok-free.app'],
        headers: {
            'Service-Worker-Allowed': '/',
        },  
    },
});

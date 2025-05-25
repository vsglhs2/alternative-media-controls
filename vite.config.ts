import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        allowedHosts: ['c144-103-155-232-207.ngrok-free.app'],
        headers: {
            'Service-Worker-Allowed': '/',
        },  
    },
    build: {
        rollupOptions: {
            input: {
                'alternative-media-controls': '/src/emulator.ts',
            },
            output: {
                entryFileNames: '[name].js', 
            }
        },
    },
});

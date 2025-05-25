import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';

export default defineConfig({
    server: {
        allowedHosts: ['c144-103-155-232-207.ngrok-free.app'],
        headers: {
            'Service-Worker-Allowed': '/',
        },  
    },
    build: {
        minify: false,
        rollupOptions: {
            input: {
                'controls': '/src/emulator.ts',
            },
            output: [
                {
                    plugins: [terser()],
                    entryFileNames: '[name].min.js', 
                },
                {
                    sourcemap: 'inline',
                    entryFileNames: '[name].js', 
                },
            ]
        },
    },
});

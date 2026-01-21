import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0', // Listen on all IPs
        hmr: {
            host: '192.168.1.109', // Ganti dengan IP lokal laptop Anda agar HMR jalan di HP
        },
        cors: true, // Izinkan CORS
    },
});

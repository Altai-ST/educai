import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH=/educai/ for GitHub Pages (the site lives in a sub-folder there)
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {host: true, port: 5173},
});

import { globSync } from 'node:fs';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Every HTML file is a page, built to the same path: work/masroofi/index.html becomes dist/work/masroofi/index.html.
const pages = globSync('**/*.html', { exclude: (path) => path.startsWith('node_modules') || path.startsWith('dist') });

export default defineConfig({
    // Separate pages, not a single-page app: unknown paths are a 404, not the home page.
    appType: 'mpa',
    plugins: [tailwindcss()],
    build: {
        rollupOptions: {
            input: Object.fromEntries(pages.map((page) => [page.replace(/\.html$/, ''), resolve(import.meta.dirname, page)])),
        },
    },
});

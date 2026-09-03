import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

const gitCommit = process.env.GITHUB_SHA ?? readGitCommit();

export default defineConfig({
  plugins: [react()],
  define: {
    __URIEL_GIT_COMMIT__: JSON.stringify(gitCommit),
  },
  base: '/',
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        viola: resolve(import.meta.dirname, 'projects/viola/index.html'),
        uriel: resolve(import.meta.dirname, 'projects/uriel/index.html'),
      },
    },
  },
});

function readGitCommit(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

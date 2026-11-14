import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import siteEntries from './config/siteEntries.json';

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
      input: Object.fromEntries(
        Object.entries(siteEntries).map(([name, entry]) => [
          name,
          resolve(import.meta.dirname, entry),
        ]),
      ),
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

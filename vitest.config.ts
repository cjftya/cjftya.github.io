import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Real-GLB integration audits rebuild the full dense landscape several times.
// Keep the CI default usable on slower runners without changing any assertions.
export default mergeConfig(viteConfig, defineConfig({ test: { testTimeout: 30000 } }));

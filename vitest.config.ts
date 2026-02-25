import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/types/generated.ts'],
    },
  },
  resolve: {
    alias: {
      'vintrace-sdk': new URL('./src/index.ts', import.meta.url).pathname,
    },
  },
});

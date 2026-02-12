import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts', 'src/utils/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/test-*.ts',
        '**/index.ts',
        '**/types/**',
        'server/errorHandler.ts' // Logger is a utility, hard to test in unit tests
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@server': resolve(__dirname, './server')
    }
  }
});

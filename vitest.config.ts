import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'seo-agent/**/*.test.ts',
      'lib/seo/**/*.test.ts',
      'app/api/seo/**/*.test.ts',
      'lib/crawler/**/*.test.ts',
      'app/api/crawler/**/*.test.ts',
      'crawler/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'seo-agent/analyzer/**/*.ts',
        'seo-agent/core/**/*.ts',
        'seo-agent/report/**/*.ts',
        'lib/seo/**/*.ts',
        'app/api/seo/**/*.ts',
      ],
      exclude: [
        'seo-agent/**/__tests__/**',
        'seo-agent/**/*.test.ts',
        'seo-agent/**/*.d.ts',
        'lib/seo/**/__tests__/**',
        'lib/seo/**/*.test.ts',
        'app/api/seo/**/__tests__/**',
        'app/api/seo/**/*.test.ts',
        'app/api/seo/**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
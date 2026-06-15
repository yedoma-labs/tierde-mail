import { resolve } from 'node:path';
import { chmodSync } from 'node:fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const entries = {
  index: resolve(__dirname, 'src/index.ts'),
  'providers/resend': resolve(__dirname, 'src/providers/resend.ts'),
  'providers/smtp': resolve(__dirname, 'src/providers/smtp.ts'),
  'providers/ses': resolve(__dirname, 'src/providers/ses.ts'),
  'providers/sendgrid': resolve(__dirname, 'src/providers/sendgrid.ts'),
  'providers/postmark': resolve(__dirname, 'src/providers/postmark.ts'),
  'preview/index': resolve(__dirname, 'src/preview/index.ts'),
  'templates/index': resolve(__dirname, 'src/templates/index.ts'),
  'testing/index': resolve(__dirname, 'src/testing/index.ts'),
  // CLI — compiled with ?raw template embedding
  'bin/tierde': resolve(__dirname, 'bin/tierde.ts'),
};

const shebangPlugin = {
  name: 'tierde-cli-shebang',
  renderChunk(code: string, chunk: { fileName: string }) {
    if (chunk.fileName === 'bin/tierde.js') {
      return { code: '#!/usr/bin/env node\n' + code, map: null };
    }
    return null;
  },
  writeBundle() {
    try {
      chmodSync(resolve(__dirname, 'dist/bin/tierde.js'), 0o755);
    } catch {
      // non-fatal: npm sets permissions on install
    }
  },
};

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      rollupTypes: false,
    }),
    shebangPlugin,
  ],
  build: {
    lib: {
      entry: entries,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-dom/server',
        'react/jsx-runtime',
        'node:http',
        'node:fs',
        'node:path',
        'node:url',
        'node:events',
        '@aws-sdk/client-ses',
        'nodemailer',
        // Runtime dependencies — installed alongside the package, not bundled
        '@yedoma-labs/bylyt-env-guard',
        '@yedoma-labs/suruk-logger',
        '@yedoma-labs/tuuru-chrono-tz',
        'pino',
        '@css-inline/css-inline',
        'html-to-text',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    target: 'node20',
    minify: false,
    sourcemap: true,
  },
});

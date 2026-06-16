import { resolve } from 'node:path';
import { readFileSync, chmodSync } from 'node:fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const entries = {
  index: resolve(__dirname, 'src/index.ts'),
  'providers/resend': resolve(__dirname, 'src/providers/resend.ts'),
  'providers/smtp': resolve(__dirname, 'src/providers/smtp.ts'),
  'providers/mailpit': resolve(__dirname, 'src/providers/mailpit.ts'),
  'providers/ses': resolve(__dirname, 'src/providers/ses.ts'),
  'providers/sendgrid': resolve(__dirname, 'src/providers/sendgrid.ts'),
  'providers/postmark': resolve(__dirname, 'src/providers/postmark.ts'),
  'webhooks/index': resolve(__dirname, 'src/webhooks/index.ts'),
  'preview/index': resolve(__dirname, 'src/preview/index.ts'),
  'templates/index': resolve(__dirname, 'src/templates/index.ts'),
  'testing/index': resolve(__dirname, 'src/testing/index.ts'),
  // CLI — compiled with ?raw template embedding
  'bin/tierde': resolve(__dirname, 'bin/tierde.ts'),
};

const rawImportPlugin = {
  name: 'raw-import-inline',
  resolveId(id: string) {
    if (id.includes('?raw')) {
      return id;
    }
    return null;
  },
  load(id: string) {
    if (id.includes('?raw')) {
      const path = id.split('?')[0];
      const content = readFileSync(path, 'utf-8');
      return `export default ${JSON.stringify(content)};`;
    }
    return null;
  },
};

const rawImportRenamePlugin = {
  name: 'raw-import-rename',
  generateBundle(options: any, bundle: Record<string, any>) {
    // Rename chunks with ? in filename to use -raw instead
    for (const [fileName, asset] of Object.entries(bundle)) {
      if (fileName.includes('?raw')) {
        const newName = fileName.replace('?raw', '-raw');
        bundle[newName] = asset;
        delete bundle[fileName];
      }
    }
  },
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
    rawImportPlugin,
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
      plugins: [rawImportRenamePlugin],
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
        'node:crypto',
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

import { resolve, dirname } from 'node:path';
import { readFileSync, chmodSync } from 'node:fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const entries = {
  index: resolve(__dirname, 'src/index.ts'),
  'providers/brevo': resolve(__dirname, 'src/providers/brevo.ts'),
  'providers/mailersend': resolve(__dirname, 'src/providers/mailersend.ts'),
  'providers/mailgun': resolve(__dirname, 'src/providers/mailgun.ts'),
  'providers/mandrill': resolve(__dirname, 'src/providers/mandrill.ts'),
  'providers/resend': resolve(__dirname, 'src/providers/resend.ts'),
  'providers/sparkpost': resolve(__dirname, 'src/providers/sparkpost.ts'),
  'providers/smtp': resolve(__dirname, 'src/providers/smtp.ts'),
  'providers/mailpit': resolve(__dirname, 'src/providers/mailpit.ts'),
  'providers/ses': resolve(__dirname, 'src/providers/ses.ts'),
  'providers/sendgrid': resolve(__dirname, 'src/providers/sendgrid.ts'),
  'providers/postmark': resolve(__dirname, 'src/providers/postmark.ts'),
  'webhooks/index': resolve(__dirname, 'src/webhooks/index.ts'),
  'react/index': resolve(__dirname, 'src/react/index.tsx'),
  'preview/index': resolve(__dirname, 'src/preview/index.ts'),
  'templates/index': resolve(__dirname, 'src/templates/index.ts'),
  'templates/sample-props': resolve(__dirname, 'src/templates/sample-props.ts'),
  'testing/index': resolve(__dirname, 'src/testing/index.ts'),
  // CLI — compiled with ?raw template embedding
  'bin/tierde': resolve(__dirname, 'bin/tierde.ts'),
};

// Inlines ?raw imports directly into the importing module so no separate file is emitted.
// Must run before Vite's built-in ?raw handler (enforce: 'pre'), otherwise Vite creates
// separate chunk files that get ?raw in the filename — unresolvable by Node at runtime.
const rawImportInlinePlugin = {
  name: 'raw-import-inline',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!code.includes('?raw')) return null;
    // Replace `import X from 'path?raw'` (single or double quotes) with inline const
    const transformed = code.replace(
      /^import (\w+) from ['"]([^'"]+\?raw)['"];?$/gm,
      (_match: string, binding: string, specifier: string) => {
        const rawPath = specifier.replace('?raw', '');
        const absolutePath = rawPath.startsWith('.') ? resolve(dirname(id), rawPath) : rawPath;
        const content = readFileSync(absolutePath, 'utf-8');
        return `const ${binding} = ${JSON.stringify(content)};`;
      },
    );
    return transformed !== code ? { code: transformed, map: null } : null;
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
    rawImportInlinePlugin,
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      entryRoot: 'src',
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

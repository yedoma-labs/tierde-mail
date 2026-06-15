import { resolve } from 'node:path';
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
};

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      rollupTypes: false,
    }),
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

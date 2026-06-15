import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createLogger } from '@yedoma-labs/suruk-logger';
import { renderEmail } from '../render.js';
import { htmlToPlainText } from '../plain-text.js';
import type { EmailTemplate } from '../types.js';

const logger = createLogger({ name: 'tierde-mail:preview' });

export interface PreviewEntry<Props = unknown> {
  template: EmailTemplate<Props>;
  props: Props;
}

export interface PreviewServerConfig {
  port?: number;
  emails: Record<string, PreviewEntry>;
}

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res: ServerResponse, html: string, status = 200): void {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  });
  res.end(html);
}

function renderPreviewShell(emails: string[]): string {
  const listItems = emails
    .map(
      (name) => `
    <li>
      <a href="/preview/${encodeURIComponent(name)}" class="email-link">${name}</a>
    </li>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>tierde-mail Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; height: 100vh; }
    .sidebar { width: 260px; flex-shrink: 0; border-right: 1px solid #e5e7eb; background: #f9fafb; display: flex; flex-direction: column; }
    .sidebar-header { padding: 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 14px; color: #111827; }
    .sidebar-header span { color: #6b7280; font-weight: 400; }
    .email-list { list-style: none; overflow-y: auto; flex: 1; padding: 8px; }
    .email-list li { margin-bottom: 2px; }
    .email-link { display: block; padding: 8px 12px; border-radius: 6px; text-decoration: none; color: #374151; font-size: 13px; transition: background 0.1s; }
    .email-link:hover { background: #e5e7eb; color: #111827; }
    .email-link.active { background: #2563eb; color: #fff; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .toolbar { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: center; }
    .toolbar button { padding: 6px 14px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; cursor: pointer; color: #374151; transition: background 0.1s; }
    .toolbar button:hover { background: #f3f4f6; }
    .toolbar button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
    .subject-bar { padding: 8px 16px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
    .subject-bar strong { color: #111827; }
    .preview-frame { flex: 1; border: none; width: 100%; }
    .empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; }
    .text-view { flex: 1; padding: 24px; font-family: monospace; font-size: 13px; white-space: pre-wrap; overflow-y: auto; background: #fff; color: #374151; line-height: 1.6; }
  </style>
</head>
<body>
  <nav class="sidebar">
    <div class="sidebar-header">tierde-mail <span>preview</span></div>
    <ul class="email-list" id="email-list">
      ${listItems}
    </ul>
  </nav>
  <div class="main" id="main">
    <div class="empty-state">Select an email to preview</div>
  </div>
  <script>
    let currentEmail = null;
    let viewMode = 'html';
    const main = document.getElementById('main');

    function setActive(name) {
      document.querySelectorAll('.email-link').forEach(el => {
        el.classList.toggle('active', el.href.endsWith('/preview/' + encodeURIComponent(name)));
      });
    }

    async function loadEmail(name) {
      currentEmail = name;
      setActive(name);
      const res = await fetch('/api/email/' + encodeURIComponent(name));
      const data = await res.json();
      renderView(data, viewMode);
    }

    function renderView(data, mode) {
      const toolbarBtns = \`
        <button onclick="switchMode('html')" class="\${mode === 'html' ? 'active' : ''}">HTML</button>
        <button onclick="switchMode('text')" class="\${mode === 'text' ? 'active' : ''}">Plain Text</button>
        <button onclick="switchMode('desktop')" class="\${mode === 'desktop' ? 'active' : ''}">Desktop</button>
        <button onclick="switchMode('mobile')" class="\${mode === 'mobile' ? 'active' : ''}">Mobile</button>
      \`;
      const subjectBar = \`<div class="subject-bar"><strong>Subject:</strong> \${data.subject}</div>\`;

      if (mode === 'text') {
        main.innerHTML = \`<div class="toolbar">\${toolbarBtns}</div>\${subjectBar}<div class="text-view">\${escapeHtml(data.text)}</div>\`;
      } else if (mode === 'html') {
        main.innerHTML = \`<div class="toolbar">\${toolbarBtns}</div>\${subjectBar}<iframe class="preview-frame" srcdoc="\${escapeAttr(data.html)}"></iframe>\`;
      } else {
        const width = mode === 'mobile' ? '375px' : '100%';
        main.innerHTML = \`<div class="toolbar">\${toolbarBtns}</div>\${subjectBar}<iframe class="preview-frame" style="width:\${width};margin:0 auto;display:block;" srcdoc="\${escapeAttr(data.html)}"></iframe>\`;
      }
      window._emailData = data;
      window._viewMode = mode;
    }

    function switchMode(mode) {
      viewMode = mode;
      if (window._emailData) renderView(window._emailData, mode);
    }

    function escapeHtml(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function escapeAttr(str) {
      return str.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    document.querySelectorAll('.email-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const name = decodeURIComponent(el.href.split('/preview/')[1] || '');
        loadEmail(name);
      });
    });
  </script>
</body>
</html>`;
}

export interface PreviewServer {
  start(): void;
  stop(): Promise<void>;
}

export function createPreviewServer(config: PreviewServerConfig): PreviewServer {
  const port = config.port ?? 3001;
  const emails = config.emails;

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';

    if (url === '/' || url === '') {
      sendHtml(res, renderPreviewShell(Object.keys(emails)));
      return;
    }

    if (url.startsWith('/api/email/')) {
      const name = decodeURIComponent(url.slice('/api/email/'.length));
      const entry = emails[name];
      if (!entry) {
        sendJson(res, { error: 'Not found' }, 404);
        return;
      }
      try {
        const html = renderEmail(entry.template.component(entry.props));
        const text = htmlToPlainText(html);
        const subject = entry.template.subject(entry.props);
        sendJson(res, { name, subject, html, text });
      } catch (err) {
        logger.error(err instanceof Error ? err : new Error(String(err)), { email: name });
        sendJson(res, { error: String(err) }, 500);
      }
      return;
    }

    if (url.startsWith('/preview/')) {
      sendHtml(res, renderPreviewShell(Object.keys(emails)));
      return;
    }

    sendJson(res, { error: 'Not found' }, 404);
  });

  return {
    start() {
      server.listen(port, () => {
        logger.info(`tierde-mail preview server running at http://localhost:${port}`);
      });
    },
    stop() {
      return new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

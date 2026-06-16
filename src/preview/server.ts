import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createLogger } from '@yedoma-labs/suruk-logger';
import { renderEmail } from '../render.js';
import { htmlToPlainText } from '../plain-text.js';
import type { EmailTemplate } from '../types.js';

const logger = createLogger({ name: 'tierde-mail:preview' });

// Incremented on each server start — SSE clients detect restart and reload
const SERVER_VERSION = Date.now();

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

function injectDarkMode(html: string): string {
  // Inject before </head> — color-scheme:dark forces @media(prefers-color-scheme:dark) to match
  const tag = '<style>:root{color-scheme:dark}</style>';
  return html.includes('</head>') ? html.replace('</head>', `${tag}</head>`) : tag + html;
}

function parseQuery(url: string): Record<string, string> {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  const params: Record<string, string> = {};
  for (const part of url.slice(idx + 1).split('&')) {
    const [k, v] = part.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return params;
}

function escH(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escA(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderPreviewShell(emails: string[]): string {
  const listItems = emails
    .map((n) => `<li><button class="email-btn" data-name="${escA(n)}">${escH(n)}</button></li>`)
    .join('');

  const compareOptions = ['<option value="">— select —</option>']
    .concat(emails.map((n) => `<option value="${escA(n)}">${escH(n)}</option>`))
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>tierde-mail Preview</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;height:100vh;overflow:hidden}
    .sidebar{width:240px;flex-shrink:0;border-right:1px solid #e5e7eb;background:#f9fafb;display:flex;flex-direction:column}
    .sidebar-header{padding:14px 16px;border-bottom:1px solid #e5e7eb;font-weight:700;font-size:13px;color:#111827;display:flex;align-items:center;gap:8px}
    .sidebar-header .muted{color:#9ca3af;font-weight:400}
    .live-badge{display:none;padding:2px 7px;background:#dcfce7;color:#166534;border-radius:10px;font-size:10px;font-weight:600}
    .email-list{list-style:none;overflow-y:auto;flex:1;padding:6px}
    .email-list li{margin-bottom:2px}
    .email-btn{display:block;width:100%;text-align:left;padding:7px 10px;border-radius:5px;border:none;background:none;font-size:12.5px;cursor:pointer;color:#374151;transition:background .1s}
    .email-btn:hover{background:#e5e7eb;color:#111827}
    .email-btn.active{background:#2563eb;color:#fff}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .toolbar{padding:10px 14px;border-bottom:1px solid #e5e7eb;display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#fff}
    .toolbar button{padding:5px 12px;border-radius:5px;border:1px solid #d1d5db;background:#fff;font-size:12px;cursor:pointer;color:#374151;transition:background .1s}
    .toolbar button:hover{background:#f3f4f6}
    .toolbar button.active{background:#2563eb;color:#fff;border-color:#2563eb}
    .toolbar select{padding:5px 8px;border-radius:5px;border:1px solid #d1d5db;font-size:12px;color:#374151;background:#fff;cursor:pointer}
    .sep{width:1px;height:20px;background:#e5e7eb;margin:0 2px}
    .subject-bar{padding:7px 14px;background:#f3f4f6;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .subject-bar strong{color:#111827}
    .frames{flex:1;display:flex;overflow:hidden}
    .frame-pane{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
    .frame-pane+.frame-pane{border-left:2px solid #e5e7eb}
    .frame-label{padding:6px 12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;font-weight:500}
    iframe.preview-frame{flex:1;border:none;width:100%;height:100%}
    .text-view{flex:1;padding:20px;font-family:monospace;font-size:12.5px;white-space:pre-wrap;overflow-y:auto;background:#fff;color:#374151;line-height:1.6}
    .empty-state{flex:1;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px}
  </style>
</head>
<body>
  <nav class="sidebar">
    <div class="sidebar-header">
      tierde <span class="muted">preview</span>
      <span class="live-badge" id="live-badge">live</span>
    </div>
    <ul class="email-list">${listItems}</ul>
  </nav>
  <div class="main">
    <div class="toolbar" id="toolbar" style="display:none">
      <button id="btn-html" class="active" onclick="setView('html')">HTML</button>
      <button id="btn-text" onclick="setView('text')">Plain Text</button>
      <div class="sep"></div>
      <button id="btn-desktop" class="active" onclick="setWidth('100%')">Desktop</button>
      <button id="btn-mobile" onclick="setWidth('375px')">Mobile</button>
      <div class="sep"></div>
      <button id="btn-dark" onclick="toggleDark()">Dark Mode</button>
      <div class="sep"></div>
      <button id="btn-compare" onclick="toggleCompare()">Compare</button>
      <select id="compare-sel" style="display:none" onchange="loadCompare(this.value)">
        ${compareOptions}
      </select>
    </div>
    <div class="subject-bar" id="subject-bar" style="display:none"></div>
    <div class="frames" id="frames">
      <div class="empty-state">Select an email to preview</div>
    </div>
  </div>
  <script>
    var current = null, compareEmail = null;
    var viewMode = 'html', frameWidth = '100%', darkMode = false, compareMode = false;
    var cache = {};
    var serverVersion = null;

    var es = new EventSource('/api/events');
    es.onmessage = function(e) {
      var d = JSON.parse(e.data);
      document.getElementById('live-badge').style.display = '';
      if (serverVersion === null) { serverVersion = d.version; return; }
      if (d.version !== serverVersion) {
        serverVersion = d.version;
        cache = {};
        if (current) load(current);
        if (compareEmail) loadExtra(compareEmail);
      }
    };

    async function fetchData(name) {
      var key = name + (darkMode ? ':dark' : '');
      if (cache[key]) return cache[key];
      var url = '/api/email/' + encodeURIComponent(name) + (darkMode ? '?dark=1' : '');
      var r = await fetch(url);
      var d = await r.json();
      cache[key] = d;
      return d;
    }

    async function load(name) {
      current = name;
      document.querySelectorAll('.email-btn').forEach(function(b) {
        b.classList.toggle('active', b.dataset.name === name);
      });
      document.getElementById('toolbar').style.display = '';
      await fetchData(name);
      render();
    }

    async function loadExtra(name) {
      compareEmail = name;
      await fetchData(name);
      render();
    }

    function loadCompare(name) {
      if (!name) { compareEmail = null; render(); return; }
      loadExtra(name);
    }

    function render() {
      var frames = document.getElementById('frames');
      var subjectBar = document.getElementById('subject-bar');
      if (!current) return;
      var key = current + (darkMode ? ':dark' : '');
      var data = cache[key];
      if (!data) return;

      subjectBar.style.display = '';
      subjectBar.innerHTML = '<strong>Subject:</strong> ' + esc(data.subject || '');

      if (viewMode === 'text') {
        frames.innerHTML = '<div class="text-view">' + esc(data.text || '') + '</div>';
        return;
      }

      frames.innerHTML = '';

      var pane1 = makePane(data.html, compareMode ? current : null);
      frames.appendChild(pane1);

      if (compareMode && compareEmail) {
        var k2 = compareEmail + (darkMode ? ':dark' : '');
        var d2 = cache[k2];
        if (d2) frames.appendChild(makePane(d2.html, compareEmail));
      }
    }

    function makePane(html, label) {
      var pane = document.createElement('div');
      pane.className = 'frame-pane';
      if (label) {
        var lbl = document.createElement('div');
        lbl.className = 'frame-label';
        lbl.textContent = label;
        pane.appendChild(lbl);
      }
      var iframe = document.createElement('iframe');
      iframe.className = 'preview-frame';
      iframe.srcdoc = html;
      if (frameWidth !== '100%') {
        iframe.style.width = frameWidth;
        iframe.style.margin = '0 auto';
        iframe.style.display = 'block';
      }
      pane.appendChild(iframe);
      return pane;
    }

    function setView(m) {
      viewMode = m;
      toggle('btn-html', m === 'html');
      toggle('btn-text', m === 'text');
      render();
    }

    function setWidth(w) {
      frameWidth = w;
      toggle('btn-desktop', w === '100%');
      toggle('btn-mobile', w !== '100%');
      render();
    }

    function toggleDark() {
      darkMode = !darkMode;
      toggle('btn-dark', darkMode);
      cache = {};
      if (current) load(current);
      if (compareEmail) loadExtra(compareEmail);
    }

    function toggleCompare() {
      compareMode = !compareMode;
      toggle('btn-compare', compareMode);
      var sel = document.getElementById('compare-sel');
      sel.style.display = compareMode ? '' : 'none';
      if (!compareMode) { compareEmail = null; sel.value = ''; }
      render();
    }

    function toggle(id, on) {
      document.getElementById(id).classList.toggle('active', on);
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    document.querySelectorAll('.email-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { load(btn.dataset.name); });
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
  const sseClients = new Set<ServerResponse>();

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const rawUrl = req.url ?? '/';
    const urlPath = rawUrl.split('?')[0] ?? '/';
    const query = parseQuery(rawUrl);

    // SSE live-reload endpoint
    if (urlPath === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ version: SERVER_VERSION })}\n\n`);
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (urlPath === '/' || urlPath === '') {
      sendHtml(res, renderPreviewShell(Object.keys(emails)));
      return;
    }

    if (urlPath.startsWith('/api/email/')) {
      const name = decodeURIComponent(urlPath.slice('/api/email/'.length));
      const entry = emails[name];
      if (!entry) {
        sendJson(res, { error: 'Not found' }, 404);
        return;
      }
      try {
        let html = renderEmail(entry.template.component(entry.props));
        if (query['dark'] === '1') html = injectDarkMode(html);
        const text = htmlToPlainText(html);
        const subject = entry.template.subject(entry.props);
        sendJson(res, { name, subject, html, text });
      } catch (err) {
        logger.error(err instanceof Error ? err : new Error(String(err)), { email: name });
        sendJson(res, { error: String(err) }, 500);
      }
      return;
    }

    if (urlPath.startsWith('/preview')) {
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

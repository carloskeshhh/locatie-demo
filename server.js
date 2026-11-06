'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const ADMIN_KEY = process.env.ADMIN_KEY;
const TTL_MS = 15 * 60 * 1000;
if (!ADMIN_KEY || ADMIN_KEY.length < 12) {
  console.error('Stel ADMIN_KEY in op een zelfgekozen sleutel van minimaal 12 tekens.');
  process.exit(1);
}

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/dashboard': ['dashboard.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/share.js': ['share.js', 'application/javascript; charset=utf-8'],
  '/dashboard.js': ['dashboard.js', 'application/javascript; charset=utf-8']
};
let latest = null;
const protectedHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'geolocation=(self)',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};

function respond(res, status, body, mime = 'application/json; charset=utf-8') {
  res.writeHead(status, { ...protectedHeaders, 'Content-Type': mime });
  res.end(mime.startsWith('application/json') ? JSON.stringify(body) : body);
}
function authorized(req) {
  const supplied = String(req.headers.authorization || '').replace(/^Bearer /i, '');
  const a = Buffer.from(supplied);
  const b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function fresh() {
  if (latest && Date.now() - latest.receivedAt > TTL_MS) latest = null;
  return latest;
}
function jsonBody(req) {
  return new Promise((resolve, reject) => {
    const parts = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 4096) {
        reject(new Error('Payload te groot'));
        req.destroy();
        return;
      }
      parts.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); }
      catch { reject(new Error('Ongeldige JSON')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && files[url.pathname]) {
    const [filename, mime] = files[url.pathname];
    try {
      const content = await fs.readFile(path.join(__dirname, 'public', filename));
      res.writeHead(200, { ...protectedHeaders, 'Content-Type': mime });
      res.end(content);
    } catch { respond(res, 500, { error: 'Kon pagina niet laden' }); }
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/share') {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
      respond(res, 415, { error: 'JSON vereist' });
      return;
    }
    let body;
    try { body = await jsonBody(req); }
    catch { if (!res.headersSent) respond(res, 400, { error: 'Ongeldige aanvraag' }); return; }
    const { latitude, longitude, accuracy } = body || {};
    if (![latitude, longitude, accuracy].every(v => typeof v === 'number' && Number.isFinite(v)) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
        accuracy < 0 || accuracy > 10000000) {
      respond(res, 400, { error: 'Ongeldige coördinaten' });
      return;
    }
    latest = { latitude, longitude, accuracy, receivedAt: Date.now() };
    respond(res, 200, { ok: true, expiresInSeconds: TTL_MS / 1000 });
    return;
  }
  if (url.pathname === '/api/latest' && req.method === 'GET') {
    if (!authorized(req)) { respond(res, 401, { error: 'Verkeerde beheerderssleutel' }); return; }
    respond(res, 200, { location: fresh() });
    return;
  }
  if (url.pathname === '/api/clear' && req.method === 'POST') {
    if (!authorized(req)) { respond(res, 401, { error: 'Verkeerde beheerderssleutel' }); return; }
    latest = null;
    respond(res, 200, { ok: true });
    return;
  }
  respond(res, 404, { error: 'Niet gevonden' });
});
server.listen(PORT, '0.0.0.0', () => console.log(`Locatiedemo draait op poort ${PORT}`));

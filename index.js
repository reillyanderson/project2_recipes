const http = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const publicFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/recipes', ['recipes.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/recipes.json', ['recipes.json', 'application/json; charset=utf-8']],
  ['/images/logo.png', ['images/logo.png', 'image/png']],
  ...['one', 'two', 'three'].map(name => [
    `/images/background-${name}.jpg`,
    [`images/background-${name}.jpg`, 'image/jpeg']
  ])
]);
const detailPage = /^\/recipes\/sample-[a-z0-9-]+$/;

function createApp() {
  return http.createServer({
    headersTimeout: 10000,
    requestTimeout: 30000,
    maxHeaderSize: 16384
  }, async (req, res) => {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');

    function send(status, body, type = 'application/json; charset=utf-8') {
      const content = Buffer.isBuffer(body) ? body : Buffer.from(
        type.startsWith('application/json') ? JSON.stringify(body) : body
      );
      res.writeHead(status, { 'Content-Type': type, 'Content-Length': content.length });
      res.end(req.method === 'HEAD' ? undefined : content);
    }

    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        req.resume();
        res.setHeader('Allow', 'GET, HEAD');
        return send(405, { message: 'This sample is read-only. Use GET or HEAD.' });
      }

      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/health') return send(200, { status: 'ok' });

      const file = detailPage.test(url.pathname)
        ? ['recipe.html', 'text/html; charset=utf-8']
        : publicFiles.get(url.pathname);
      if (!file) {
        return send(404, 'Page not found. Browse recipes at /recipes.', 'text/plain; charset=utf-8');
      }
      const content = await readFile(path.join(__dirname, 'public', file[0]));
      return send(200, content, file[1]);
    } catch (error) {
      console.error(error.message);
      return send(500, { message: 'Something went wrong. Please try again.' });
    }
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`Gourmet Group listening on port ${port}`));
}

module.exports = createApp;

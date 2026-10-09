const http = require('http');

const revision = {
  version: 'v1',
  message: 'App Service revisions label test - initial revision',
};

const server = http.createServer((request, response) => {
  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify({
    ...revision,
    path: request.url,
    timestamp: new Date().toISOString(),
  }));
});

server.listen(process.env.PORT || 8080);

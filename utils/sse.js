
const clients = new Set();

function sseHandler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n'); 

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
}

function broadcast(eventName = 'reload', data = {}) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data || {});
  const msg = `event: ${eventName}\n` + `data: ${payload}\n\n`;
  for (const res of clients) {
    try { res.write(msg); } catch (e) { /* ignore errors */ }
  }
}

module.exports = { sseHandler, broadcast };

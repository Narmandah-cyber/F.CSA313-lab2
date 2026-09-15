// Лаб 2 — k6 load тестэд зориулсан энгийн локал сервер (Node.js, гадаад dependency-гүй)
// Ажиллуулах: node server/server.js   (http://localhost:3000)
//
// Endpoint-ууд:
//   GET /        — энгийн "хуудас": JSON өгөгдөл бэлтгэж (CPU ажил ~5 мс) буцаана
//   GET /slow    — хариуг 100 мс удаашруулдаг endpoint (Алхам 5)
//   GET /health  — хамгийн хөнгөн endpoint
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

// Бодит хуудас render хийхтэй төстэй CPU ачаалал: бүтээгдэхүүний жагсаалт үүсгэж hash тооцоолно.
// Node.js нэг thread-тэй тул зэрэгцээ хүсэлт олшрох тусам хүсэлтүүд дараалалд (queue) зогсоно.
function renderProducts() {
  const items = [];
  for (let i = 0; i < 40; i++) {
    let h = `product-${i}`;
    for (let j = 0; j < 350; j++) {
      h = crypto.createHash('sha256').update(h).digest('hex');
    }
    items.push({ id: i, name: `Бүтээгдэхүүн ${i}`, sku: h.slice(0, 12), price: 1000 + i * 250 });
  }
  return items;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/') {
    const body = JSON.stringify({ page: 'home', products: renderProducts() });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(body);
  }

  if (url.pathname === '/slow') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ page: 'slow', delayMs: 100 }));
    }, 100);
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

import http from "node:http";

const PORT = process.env.PORT || 3002;

const products = [
  { id: 1, name: "Laptop", price: 999.99 },
  { id: 2, name: "Keyboard", price: 79.99 },
  { id: 3, name: "Mouse", price: 29.99 },
  { id: 4, name: "Monitor", price: 299.99 },
];

const server = http.createServer((req, res) => {
  if (req.url === "/products") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(products));
  } else if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Products service listening on port ${PORT}`);
});

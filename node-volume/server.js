import fs from "fs";
import path from "path";
import http from "http";

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR;
const counterFile = path.join(DATA_DIR, "counter.json");

function readCounter() {
  try {
    const data = fs.readFileSync(counterFile, "utf8");
    return JSON.parse(data).count;
  } catch {
    return 0;
  }
}

function writeCounter(count) {
  fs.writeFileSync(counterFile, JSON.stringify({ count }));
}

const server = http.createServer((req, res) => {
  if (req.url !== "/") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const count = readCounter() + 1;
  writeCounter(count);

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <html>
      <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <h1>This page has been loaded ${count} time${count === 1 ? "" : "s"}</h1>
      </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

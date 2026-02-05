import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createClient } from "redis";

const port = process.env.PORT || 3000;
const redisUrl = process.env.REDIS_URL;

const redis = createClient({ url: redisUrl });
redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const html = await readFile(new URL("./public/index.html", import.meta.url));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } else if (req.method === "GET" && req.url === "/api/count") {
    const count = await redis.incr("request_count");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

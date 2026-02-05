import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 3000;
const mySecret = process.env.MY_SECRET;
const myConfig = process.env.MY_CONFIG;

const server = createServer(async (req, res) => {
  if (req.url === "/api/secrets") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        my_secret: mySecret || "(not set)",
        my_config: myConfig || "(not set)",
      })
    );
    return;
  }

  try {
    const html = await readFile(join(__dirname, "public", "index.html"), "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

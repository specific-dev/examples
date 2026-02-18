import http from "node:http";

const PORT = process.env.PORT || 3000;
const USERS_URL = process.env.USERS_URL;
const PRODUCTS_URL = process.env.PRODUCTS_URL;

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/" || req.url === "/api") {
    try {
      // Fetch data from both internal services in parallel
      const [users, products] = await Promise.all([
        fetchJson(USERS_URL),
        fetchJson(PRODUCTS_URL),
      ]);

      const response = {
        message: "Gateway aggregated data from internal services",
        data: {
          users,
          products,
        },
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
  console.log(`  USERS_URL: ${USERS_URL}`);
  console.log(`  PRODUCTS_URL: ${PRODUCTS_URL}`);
});

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

const port = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database table
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Database initialized");
}

// Parse JSON body from request
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  try {
    // GET /notes - List all notes
    if (req.method === "GET" && req.url === "/notes") {
      const result = await pool.query(
        "SELECT * FROM notes ORDER BY created_at DESC"
      );
      res.writeHead(200);
      res.end(JSON.stringify(result.rows));
      return;
    }

    // POST /notes - Create a note
    if (req.method === "POST" && req.url === "/notes") {
      const body = await parseBody(req);
      if (!body.content) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "content is required" }));
        return;
      }
      const result = await pool.query(
        "INSERT INTO notes (content) VALUES ($1) RETURNING *",
        [body.content]
      );
      res.writeHead(201);
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // Health check
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Root endpoint - serve HTML
    if (req.method === "GET" && req.url === "/") {
      const html = await readFile(join(__dirname, "public", "index.html"), "utf-8");
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end(html);
      return;
    }

    // 404 for everything else
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error("Error:", err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

initDb().then(() => {
  server.listen(port, () => {
    console.log(`Notes API running on port ${port}`);
  });
});

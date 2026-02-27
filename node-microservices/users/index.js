import http from "node:http";
import pg from "pg";

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);

  const { rowCount } = await pool.query("SELECT 1 FROM users LIMIT 1");
  if (rowCount === 0) {
    await pool.query(`
      INSERT INTO users (name, email) VALUES
        ('Alice', 'alice@example.com'),
        ('Bob', 'bob@example.com'),
        ('Charlie', 'charlie@example.com')
    `);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/users") {
    try {
      const { rows } = await pool.query(
        "SELECT id, name, email FROM users ORDER BY id"
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(rows));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Users service listening on port ${PORT}`);
  });
});

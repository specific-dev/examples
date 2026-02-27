import http from "node:http";
import pg from "pg";

const PORT = process.env.PORT || 3002;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL
    )
  `);

  const { rowCount } = await pool.query("SELECT 1 FROM products LIMIT 1");
  if (rowCount === 0) {
    await pool.query(`
      INSERT INTO products (name, price) VALUES
        ('Laptop', 999.99),
        ('Keyboard', 79.99),
        ('Mouse', 29.99),
        ('Monitor', 299.99)
    `);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/products") {
    try {
      const { rows } = await pool.query(
        "SELECT id, name, price FROM products ORDER BY id"
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
    console.log(`Products service listening on port ${PORT}`);
  });
});

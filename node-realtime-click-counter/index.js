import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { clicksTable } from "./db/schema.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = drizzle(process.env.DATABASE_URL);
const fastify = Fastify({ logger: true });

// Electric protocol params that must be forwarded from client
const ELECTRIC_PARAMS = ["offset", "handle", "live", "cursor"];

// Serve static files
fastify.register(fastifyStatic, {
  root: join(__dirname, "public"),
});

// Proxy endpoint for Electric sync - defines shape server-side
fastify.get("/api/sync/clicks", async (request, reply) => {
  const originUrl = new URL("/v1/shape", process.env.DATABASE_SYNC_URL);

  // Server defines the shape (table) - client cannot override
  originUrl.searchParams.set("table", "clicks");

  // Forward Electric protocol params from client
  for (const param of ELECTRIC_PARAMS) {
    const value = request.query[param];
    if (value !== undefined) {
      originUrl.searchParams.set(param, value);
    }
  }

  // Default offset for initial request
  if (!originUrl.searchParams.has("offset")) {
    originUrl.searchParams.set("offset", "-1");
  }

  // Inject secret server-side (never exposed to client)
  originUrl.searchParams.set("secret", process.env.DATABASE_SYNC_SECRET);

  const response = await fetch(originUrl.toString());

  // Forward response headers (except compression-related)
  for (const [key, value] of response.headers.entries()) {
    if (key !== "content-encoding" && key !== "content-length") {
      reply.header(key, value);
    }
  }

  reply.status(response.status);
  return reply.send(response.body);
});

// Increment click count with single atomic upsert
fastify.post("/api/click", async () => {
  const result = await db
    .insert(clicksTable)
    .values({ id: 1, count: 1 })
    .onConflictDoUpdate({
      target: clicksTable.id,
      set: { count: sql`${clicksTable.count} + 1` },
    })
    .returning();

  return { count: result[0].count };
});

// Start server
const port = process.env.PORT || 3000;
fastify.listen({ port: Number(port), host: "0.0.0.0" });

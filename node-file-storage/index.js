import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  paginateListObjectsV2,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash, randomBytes } from "node:crypto";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const bucket = process.env.S3_BUCKET || "files";
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const fastify = Fastify({ logger: true });

// Serve static files
fastify.register(fastifyStatic, {
  root: join(__dirname, "public"),
});

// Enable multipart uploads with 200KB limit
fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 200 * 1024, // 200KB
  },
});

// The cookie is a bearer capability. Hash it for the storage prefix so a key in
// an S3 listing or storage log cannot be reused as a browser credential.
const sessionSeconds = 86400;
fastify.decorateRequest("collection", "");
fastify.addHook("onRequest", async (request, reply) => {
  const local = ["localhost", "127.0.0.1"].includes(request.hostname.split(":")[0]);
  const name = local ? "demo_files" : "__Host-demo_files";
  let token = (request.headers.cookie || "").split(/; */)
    .find(part => part.startsWith(name + "="))?.slice(name.length + 1);
  const now = Math.floor(Date.now() / 1000);
  const issued = Number(token?.split(".")[0]);
  if (!/^\d{10}\.[a-f0-9]{64}$/.test(token || "") || issued > now || now - issued >= sessionSeconds) {
    token = now + "." + randomBytes(32).toString("hex");
    reply.header("Set-Cookie", name + "=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + sessionSeconds + (local ? "" : "; Secure"));
  }
  request.collection = "visitors/" + createHash("sha256").update(token).digest("hex") + "/";
  reply.header("Cache-Control", "private, no-store");
});

function objectKey(request, filename) {
  return request.collection + Buffer.from(filename).toString("base64url");
}

// Check if buffer contains valid text (no binary/non-printable characters)
function isValidTextFile(buffer) {
  for (const byte of buffer) {
    // Allow printable ASCII, tabs, newlines, and carriage returns
    const isPrintable = byte >= 32 && byte <= 126;
    const isWhitespace = byte === 9 || byte === 10 || byte === 13;
    if (!isPrintable && !isWhitespace) {
      return false;
    }
  }
  return true;
}

// Upload a file
fastify.post("/upload", async (request, reply) => {
  const file = await request.file();

  if (!file || !file.filename.toLowerCase().endsWith(".txt")) {
    return reply.status(400).send({ error: "Only .txt files are allowed" });
  }

  const buffer = await file.toBuffer();

  if (buffer.length > 200 * 1024) {
    return reply.status(400).send({ error: "File size exceeds 200KB limit" });
  }

  if (!isValidTextFile(buffer)) {
    return reply.status(400).send({ error: "File contains invalid content - only plain text is allowed" });
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey(request, file.filename),
      Body: buffer,
    })
  );

  return { success: true, key: file.filename };
});

// List all files
fastify.get("/files", async (request) => {
  const files = [];
  for await (const page of paginateListObjectsV2({ client: s3 }, { Bucket: bucket, Prefix: request.collection })) {
    for (const object of page.Contents || []) {
      files.push({
        key: Buffer.from(object.Key.slice(request.collection.length), "base64url").toString(),
        size: object.Size,
        lastModified: object.LastModified,
      });
    }
  }
  return files;
});

// Download a file
fastify.get("/files/:key", async (request, reply) => {
  const { key } = request.params;

  let result;
  try {
    result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey(request, key) }));
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) return reply.code(404).send({ error: "File not found" });
    throw error;
  }

  reply.header(
    "Content-Type",
    result.ContentType || "application/octet-stream"
  );
  reply.header("Content-Disposition", "attachment");

  return reply.send(result.Body);
});

// Delete a file
fastify.delete("/files/:key", async (request) => {
  const { key } = request.params;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey(request, key) }));
  return { success: true };
});

if (process.argv.includes("--expire-uploads")) {
  const cutoff = Date.now() - sessionSeconds * 1000;
  for await (const page of paginateListObjectsV2({ client: s3 }, { Bucket: bucket, Prefix: "visitors/" })) {
    for (const object of page.Contents || []) {
      if (/^visitors\/[a-f0-9]{64}\/[a-zA-Z0-9_-]+$/.test(object.Key) && object.LastModified?.getTime() < cutoff) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: object.Key }));
      }
    }
  }
} else {
  const port = process.env.PORT || 3000;
  await fastify.listen({ port: Number(port), host: "0.0.0.0" });
}

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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

  if (!file.filename.toLowerCase().endsWith(".txt")) {
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
      Key: file.filename,
      Body: buffer,
    })
  );

  return { success: true, key: file.filename };
});

// List all files
fastify.get("/files", async () => {
  const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));

  return (result.Contents || []).map((obj) => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
  }));
});

// Download a file
fastify.get("/files/:key", async (request, reply) => {
  const { key } = request.params;

  const result = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  reply.header(
    "Content-Type",
    result.ContentType || "application/octet-stream"
  );
  reply.header("Content-Disposition", `attachment; filename="${key}"`);

  return reply.send(result.Body);
});

// Delete a file
fastify.delete("/files/:key", async (request) => {
  const { key } = request.params;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return { success: true };
});

// Start server
const port = process.env.PORT || 3000;
fastify.listen({ port: Number(port), host: "0.0.0.0" });

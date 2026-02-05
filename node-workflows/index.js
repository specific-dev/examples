import { createServer } from "node:http";
import { Connection, Client } from "@temporalio/client";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities.js";

const port = process.env.PORT || 3000;
const namespace = process.env.TEMPORAL_NAMESPACE || "default";
const taskQueue = "tasks";

// Determine Temporal address: production uses TEMPORAL_ADDRESS secret,
// dev uses TEMPORAL_HOST + TEMPORAL_PORT from inter-service networking
const address =
  process.env.TEMPORAL_ADDRESS ||
  `${process.env.TEMPORAL_HOST}:${process.env.TEMPORAL_PORT}`;

// Determine if using Temporal Cloud (API key present)
const isCloud = !!process.env.TEMPORAL_API_KEY;

// Render HTML page
function renderPage(workflows) {
  const statusColors = {
    RUNNING: "#3b82f6",
    COMPLETED: "#22c55e",
    FAILED: "#ef4444",
    CANCELED: "#6b7280",
    TERMINATED: "#f97316",
    TIMED_OUT: "#eab308",
  };

  const taskRows = workflows
    .map((w) => {
      const color = statusColors[w.status] || "#6b7280";
      const time = new Date(w.startTime).toLocaleString();
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #333; font-family: monospace; font-size: 14px;">${w.id}</td>
          <td style="padding: 12px; border-bottom: 1px solid #333;">
            <span style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${w.status}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #333; color: #888; font-size: 14px;">${time}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Temporal Tasks</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, sans-serif;
      background: #111;
      color: #fff;
    }
    .container {
      text-align: center;
      width: 100%;
      max-width: 700px;
      padding: 20px;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #666;
      margin-bottom: 2rem;
    }
    button {
      font-size: 1.5rem;
      padding: 1rem 3rem;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #2563eb;
    }
    button:active {
      transform: scale(0.98);
    }
    .table-container {
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 2rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #888;
      border-bottom: 1px solid #333;
      background: #222;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Temporal Tasks</h1>
    <p class="subtitle">A simple task queue powered by Temporal</p>

    <form method="POST" action="/schedule">
      <button type="submit">Schedule New Task</button>
    </form>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Status</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          ${taskRows || '<tr><td colspan="3" style="padding: 24px; text-align: center; color: #666;">No tasks yet. Click the button above to schedule one!</td></tr>'}
        </tbody>
      </table>
    </div>

  </div>

  <script>
    const statusColors = {
      RUNNING: "#3b82f6",
      COMPLETED: "#22c55e",
      FAILED: "#ef4444",
      CANCELED: "#6b7280",
      TERMINATED: "#f97316",
      TIMED_OUT: "#eab308",
    };

    let pollInterval = null;
    let pollStartTime = null;
    const MIN_POLL_DURATION = 5000;

    function renderRows(workflows) {
      if (!workflows.length) {
        return '<tr><td colspan="3" style="padding: 24px; text-align: center; color: #666;">No tasks yet. Click the button above to schedule one!</td></tr>';
      }
      return workflows.map(w => {
        const color = statusColors[w.status] || "#6b7280";
        const time = new Date(w.startTime).toLocaleString();
        return \`
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333; font-family: monospace; font-size: 14px;">\${w.id}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333;">
              <span style="background: \${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">\${w.status}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #333; color: #888; font-size: 14px;">\${time}</td>
          </tr>
        \`;
      }).join("");
    }

    async function fetchWorkflows() {
      const res = await fetch("/api/workflows");
      return res.json();
    }

    async function poll() {
      const workflows = await fetchWorkflows();
      document.querySelector("tbody").innerHTML = renderRows(workflows);

      const hasRunning = workflows.some(w => w.status === "RUNNING");
      const elapsedTime = Date.now() - pollStartTime;
      if (!hasRunning && elapsedTime >= MIN_POLL_DURATION && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        pollStartTime = null;
      }
    }

    function startPolling() {
      if (pollInterval) return;
      pollStartTime = Date.now();
      pollInterval = setInterval(poll, 1000);
    }

    document.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      await fetch("/schedule", { method: "POST" });
      await poll();
      startPolling();
    });
  </script>
</body>
</html>
  `;
}

// Track resources for cleanup
let worker = null;
let server = null;

// Graceful shutdown handler
async function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down...`);

  if (server) {
    server.close();
  }

  if (worker) {
    await worker.shutdown();
  }

  process.exit(0);
}

// Handle termination signals
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Build TLS config - for Temporal Cloud, we need to enable TLS
// NativeConnection may need explicit empty object instead of boolean
const tlsConfig = isCloud ? {} : false;

// Retry connection with backoff
async function connectClientWithRetry(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await Connection.connect({
        address,
        tls: isCloud,
        apiKey: process.env.TEMPORAL_API_KEY,
      });
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Client connection failed: ${err.message}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function connectWorkerWithRetry(maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await NativeConnection.connect({
        address,
        tls: tlsConfig,
        apiKey: process.env.TEMPORAL_API_KEY,
      });
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Worker connection failed: ${err.message}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function main() {
  console.log(`Connecting to Temporal at ${address} (namespace: ${namespace})`);

  // Create separate connections for client and worker
  const clientConnection = await connectClientWithRetry();
  const workerConnection = await connectWorkerWithRetry();

  // Create Temporal client
  const client = new Client({
    connection: clientConnection,
    namespace,
  });

  // Start worker in the background
  worker = await Worker.create({
    connection: workerConnection,
    namespace,
    taskQueue,
    workflowsPath: new URL("./workflows.js", import.meta.url).pathname,
    activities,
  });

  // Run worker in background (don't await)
  worker.run().catch((err) => {
    // Ignore shutdown errors
    if (err.message?.includes("CANCELLED") || err.name === "ShutdownError") {
      return;
    }
    console.error("Worker error:", err);
    process.exit(1);
  });

  console.log("Temporal worker started");

  // HTTP server
  server = createServer(async (req, res) => {
    try {
      // GET / - Show web interface with task list
      if (req.method === "GET" && req.url === "/") {
        // List all workflows
        const workflows = [];
        for await (const workflow of client.workflow.list()) {
          workflows.push({
            id: workflow.workflowId,
            status: workflow.status.name,
            startTime: workflow.startTime,
          });
        }

        // Sort by start time (newest first) and limit to 10
        workflows.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        const latestWorkflows = workflows.slice(0, 10);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(renderPage(latestWorkflows));
        return;
      }

      // POST /schedule - Schedule a new task
      if (req.method === "POST" && req.url === "/schedule") {
        const taskId = `task-${Date.now()}`;
        await client.workflow.start("taskWorkflow", {
          taskQueue,
          workflowId: taskId,
          args: [taskId],
        });
        console.log(`Started workflow: ${taskId}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: taskId }));
        return;
      }

      // GET /api/workflows - JSON endpoint for polling
      if (req.method === "GET" && req.url === "/api/workflows") {
        const workflows = [];
        for await (const workflow of client.workflow.list()) {
          workflows.push({
            id: workflow.workflowId,
            status: workflow.status.name,
            startTime: workflow.startTime,
          });
        }
        workflows.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        const latestWorkflows = workflows.slice(0, 10);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(latestWorkflows));
        return;
      }

      // Health check
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      // 404 for everything else
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 Not Found</h1>");
    } catch (err) {
      console.error("Error:", err);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end("<h1>500 Internal Server Error</h1>");
    }
  });

  server.listen(port, () => {
    console.log(`Task API running on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});

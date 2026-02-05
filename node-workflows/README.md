# Temporal Tasks Example

A simple task queue application demonstrating how to use Temporal as a dev-only service with Temporal Cloud in production.

## How It Works

- **Development**: Runs a local Temporal server automatically via `specific dev`
- **Production**: Connects to Temporal Cloud using configs and secrets

The `temporal` service is defined as dev-only (has `dev.command` but no top-level `command`), so it only runs locally and is excluded from production deployment.

## Local Development

1. Install the Temporal CLI: https://docs.temporal.io/cli

2. Run the app:
   ```bash
   specific dev
   ```

3. Visit the API endpoint to schedule tasks:
   ```bash
   curl http://localhost:PORT/
   ```

4. Open the Temporal UI to monitor workflows (URL shown in `specific dev` output)

## Production Deployment

1. Create a Temporal Cloud account and namespace at https://cloud.temporal.io

2. Set the required configs and secrets:
   ```bash
   # Configs (connection details)
   specific config set temporal_address YOUR_NAMESPACE.tmprl.cloud:7233
   specific config set temporal_namespace YOUR_NAMESPACE

   # Secret (API key for authentication)
   specific secrets set temporal_api_key YOUR_API_KEY
   ```

3. Deploy:
   ```bash
   specific deploy
   ```

## Web Interface

### GET /

Displays a simple web interface showing:
- A "Schedule New Task" button
- A table of all tasks with their IDs, statuses, and start times

Status colors indicate workflow state (running, completed, failed, etc).

### POST /schedule

Schedules a new task workflow and redirects back to the home page.

### GET /health

Health check endpoint (returns JSON).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Development                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │  temporal   │◄────│  app (worker + HTTP server)     │   │
│  │  (dev-only) │     │                                 │   │
│  │             │     │  - Schedules workflows          │   │
│  │  - gRPC API │     │  - Processes tasks              │   │
│  │  - Admin UI │     │  - Lists workflow statuses      │   │
│  └─────────────┘     └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Production                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │  Temporal   │◄────│  app (worker + HTTP server)     │   │
│  │   Cloud     │     │                                 │   │
│  │             │     │  Connected via configs/secrets: │   │
│  │  (managed)  │     │  - temporal_address (config)    │   │
│  │             │     │  - temporal_namespace (config)  │   │
│  │             │     │  - temporal_api_key (secret)    │   │
│  └─────────────┘     └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

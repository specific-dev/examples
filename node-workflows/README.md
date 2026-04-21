# Temporal Tasks Example

A simple task queue application demonstrating how to use Temporal with Specific — a local dev server in development and a managed Temporal Cloud namespace in production.

## How It Works

The `temporal "tasks" {}` block in `specific.hcl` is all that's needed:

- **Development**: `specific dev` automatically starts a local Temporal server with persistent storage and exposes the Web UI in the admin sidebar.
- **Production**: `specific deploy` provisions a managed Temporal Cloud namespace, service account, and API key.

The same three reference attributes (`temporal.tasks.url`, `.namespace`, `.api_key`) resolve to the correct values in each environment, so no environment-specific overrides are needed.

## Local Development

```bash
specific dev
```

Then open the app URL shown in the output to schedule tasks, and open the Temporal UI from the admin sidebar to monitor workflows.

## Production Deployment

```bash
specific deploy
```

No configs or secrets to set — Specific provisions the Temporal Cloud namespace and injects credentials automatically.

## Web Interface

### GET /

Displays a simple web interface showing:
- A "Schedule New Task" button
- A table of recent tasks with their IDs, statuses, and start times

Status colors indicate workflow state (running, completed, failed, etc.).

### POST /schedule

Schedules a new task workflow.

### GET /api/workflows

JSON endpoint returning the latest workflow statuses (used by the frontend for polling).

### GET /health

Health check endpoint.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Development                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │  Temporal   │◄────│  app (worker + HTTP server)     │   │
│  │  dev server │     │                                 │   │
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
│  │             │     │  Credentials injected via:      │   │
│  │  (managed   │     │  - temporal.tasks.url           │   │
│  │   by        │     │  - temporal.tasks.namespace     │   │
│  │   Specific) │     │  - temporal.tasks.api_key       │   │
│  └─────────────┘     └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

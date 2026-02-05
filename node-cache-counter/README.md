# Counter API

A simple Node.js HTTP server that counts page visits using Redis, managed by Specific.

## What's included

- `code/index.js` - HTTP server that increments a Redis counter on each request
- `code/package.json` - Node.js project configuration with redis dependency
- `code/specific.hcl` - Specific configuration defining the service and Redis database

## Configuration

The `specific.hcl` defines:

- A Redis database for storing the visit count
- A build configuration with automatic dependency installation
- A service that runs the Node.js server
- The service is exposed publicly via `expose {}`
- In development, uses `node --watch` for auto-reload

## API

### GET /

Returns the current visit count (incremented on each call).

**Response:**
```json
{
  "count": 42
}
```

## Running locally

```bash
cd code
specific dev
```

Then visit `https://api.localhost` to see the counter increment.

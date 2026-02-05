# Hello API

A minimal Node.js HTTP server example for Specific.

## What's included

- `index.js` - Simple HTTP server that responds with JSON
- `package.json` - Node.js project configuration
- `specific.hcl` - Specific configuration defining the service

## Configuration

The `specific.hcl` defines:

- A build configuration with automatic dependency installation
- A service that runs the Node.js server
- The service is exposed publicly via `expose {}`
- In development, uses `node --watch` for auto-reload

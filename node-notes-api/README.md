# Notes API

A simple notes API example with a PostgreSQL database.

## What's included

- `index.js` - HTTP server with CRUD endpoints for notes
- `package.json` - Node.js project with pg dependency
- `specific.hcl` - Specific configuration with database

## Configuration

The `specific.hcl` defines:

- A PostgreSQL database named "main"
- A build configuration with automatic dependency installation
- A service that runs the Node.js server
- The `DATABASE_URL` environment variable is automatically injected from the database

## API Endpoints

- `GET /notes` - List all notes
- `POST /notes` - Create a note (body: `{"content": "..."}`)
- `GET /health` - Health check

# Inter-Service Networking Demo

This example demonstrates how services can communicate with each other using Specific's service reference syntax.

## Architecture

```
                    ┌─────────────┐
    Internet ──────►│   Gateway   │ (public)
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │    Users    │           │  Products   │
       └─────────────┘           └─────────────┘
         (internal)                (internal)
```

- **Gateway** - Public-facing service that aggregates data from internal services
- **Users** - Internal service that returns user data
- **Products** - Internal service that returns product data

## How it works

In `specific.hcl`, the gateway service uses `service.users.url` and `service.products.url` to get the URLs of the internal services:

```hcl
service "gateway" {
  endpoint {
    public = true
  }

  env = {
    PORT = port
    USERS_URL = service.users.url      # Resolves to http://localhost:PORT in dev
    PRODUCTS_URL = service.products.url # Resolves to http://users:80 in prod
  }
}
```

## Running locally

```bash
cd examples/inter-service-demo
specific dev
```

Then visit the gateway URL shown in the output. You'll see aggregated data from both internal services.

## Expected output

When you visit the gateway, you'll see:

```json
{
  "message": "Gateway aggregated data from internal services",
  "data": {
    "users": [
      { "id": 1, "name": "Alice", "email": "alice@example.com" },
      { "id": 2, "name": "Bob", "email": "bob@example.com" },
      { "id": 3, "name": "Charlie", "email": "charlie@example.com" }
    ],
    "products": [
      { "id": 1, "name": "Laptop", "price": 999.99 },
      { "id": 2, "name": "Keyboard", "price": 79.99 },
      { "id": 3, "name": "Mouse", "price": 29.99 },
      { "id": 4, "name": "Monitor", "price": 299.99 }
    ]
  }
}
```

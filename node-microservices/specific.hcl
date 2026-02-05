# Inter-service networking demo
# This example shows how services can communicate with each other
# using the service.{name}.url reference syntax.

build "app" {
  base = "node"
}

# Gateway service - public endpoint that aggregates data from internal services
service "gateway" {
  build = build.app
  command = "node gateway/index.js"

  endpoint {
    public = true
  }

  env = {
    PORT = port
    USERS_HOST = service.users.url
    PRODUCTS_HOST = service.products.url
  }

  dev {
    command = "node gateway/index.js"
  }
}

# Users service - internal only, returns user data
service "users" {
  build = build.app
  command = "node users/index.js"

  endpoint {}

  env = {
    PORT = port
  }

  dev {
    command = "node users/index.js"
    DATABASE_URL = postgres.db.url
  }
}

# Products service - internal only, returns product data
service "products" {
  build = build.app
  command = "node products/index.js"

  endpoint {}

  env = {
    PORT = port
    DATABASE_URL = postgres.db.url
  }

  dev {
    command = "node products/index.js"
  }
}

postgres "db" {}

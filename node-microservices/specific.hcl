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
    PORT         = port
    USERS_URL    = "http://${service.users.private_url}/users"
    PRODUCTS_URL = "http://${service.products.private_url}/products"
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
    DATABASE_URL = postgres.users_db.url
  }

  dev {
    command = "node users/index.js"
  }
}

# Products service - internal only, returns product data
service "products" {
  build = build.app
  command = "node products/index.js"

  endpoint {}

  env = {
    PORT = port
    DATABASE_URL = postgres.products_db.url
  }

  dev {
    command = "node products/index.js"
  }
}

postgres "products_db" {}
postgres "users_db" {}

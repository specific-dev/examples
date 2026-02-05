postgres "main" {}

build "api" {
  base = "node"
}

service "api" {
  build = build.api
  command = "node index.js"
  expose {}

  env = {
    PORT         = port
    DATABASE_URL = postgres.main.url
  }

  dev {
    command = "node --watch index.js"
  }
}

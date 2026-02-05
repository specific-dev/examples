build "api" {
  base = "node"
}

service "api" {
  build = build.api
  command = "node index.js"
  expose {}

  env = {
    PORT = port
  }

  dev {
    command = "node --watch index.js"
  }
}

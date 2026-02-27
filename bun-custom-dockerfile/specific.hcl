build "api" {
  dockerfile = "Dockerfile"
}

service "api" {
  build   = build.api
  command = "bun run src/index.ts"

  env = {
    PORT = port
  }

  endpoint {
    public = true
  }
}

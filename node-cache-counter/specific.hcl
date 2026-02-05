redis "cache" {}

build "api" {
  base = "node"
}

service "api" {
  build = build.api
  command = "node index.js"
  expose {}

  env = {
    PORT      = port
    REDIS_URL = redis.cache.url
  }

  dev {
    command = "node --watch index.js"
  }
}

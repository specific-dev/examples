temporal "tasks" {}

build "app" {
  base = "node"
}

service "app" {
  build   = build.app
  command = "node index.js"
  expose {}

  env = {
    PORT               = port
    TEMPORAL_ADDRESS   = temporal.tasks.url
    TEMPORAL_NAMESPACE = temporal.tasks.namespace
    TEMPORAL_API_KEY   = temporal.tasks.api_key
  }

  dev {
    command = "node --watch index.js"
  }
}

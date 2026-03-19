temporal "tasks" {}

build "app" {
  base = "node"
}

# Temporal Cloud address for production (e.g., your-namespace.tmprl.cloud:7233)
config "temporal_address" {}

# API key for Temporal Cloud - not required in dev
secret "temporal_api_key" {
  dev {
    required = false
  }
}

service "app2" {
  build   = build.app
  command = "node index.js"
  expose {}

  env = {
    PORT               = port
    TEMPORAL_NAMESPACE = temporal.tasks.namespace
    TEMPORAL_ADDRESS   = config.temporal_address
    TEMPORAL_API_KEY   = secret.temporal_api_key
    OTHER = service.app.public_url
  }

  dev {
    command = "node --watch index.js"
    env = {
      TEMPORAL_ADDRESS = temporal.tasks.url
      TEMPORAL_API_KEY = temporal.tasks.api_key
    }
  }
}

service "app" {
  build   = build.app
  command = "node index.js"
  expose {}

  env = {
    PORT               = port
    TEMPORAL_NAMESPACE = temporal.tasks.namespace
    TEMPORAL_ADDRESS   = config.temporal_address
    TEMPORAL_API_KEY   = secret.temporal_api_key
  }

  dev {
    command = "node --watch index.js"
    env = {
      TEMPORAL_ADDRESS = temporal.tasks.url
      TEMPORAL_API_KEY = temporal.tasks.api_key
    }
  }
}

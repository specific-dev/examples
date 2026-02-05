# Dev-only Temporal server (not deployed to production)
service "temporal" {
  # gRPC endpoint for workers/clients
  endpoint "grpc" {}

  # Admin UI - publicly accessible
  endpoint "ui" {
    public = true
  }

  dev {
    command = "temporal server start-dev --port $GRPC_PORT --ui-port $UI_PORT --db-filename /tmp/temporal.db"
    env = {
      GRPC_PORT = endpoint.grpc.port
      UI_PORT   = endpoint.ui.port
    }
  }
}

build "app" {
  base = "node"
}

# Configs for Temporal connection (set by user for production)
config "temporal_address" {}

config "temporal_namespace" {
  dev {
    default = "default" # Local Temporal uses "default" namespace
  }
}

# API key is a true secret - not required in dev (local Temporal doesn't need auth)
secret "temporal_api_key" {
  dev {
    required = false
  }
}

service "app" {
  build   = build.app
  command = "node index.js"
  expose {}

  env = {
    PORT               = port
    TEMPORAL_ADDRESS   = config.temporal_address
    TEMPORAL_NAMESPACE = config.temporal_namespace
    TEMPORAL_API_KEY   = secret.temporal_api_key
  }

  dev {
    command = "node --watch index.js"
    env = {
      TEMPORAL_ADDRESS = service.temporal.endpoint.grpc.url
    }
  }
}

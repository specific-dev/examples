build "api" {
  base = "node"
}

secret "my_secret" {}

config "my_config" {}

service "api" {
  build = build.api
  command = "node index.js"
  expose {}

  env = {
    PORT = port
    MY_SECRET = secret.my_secret
    MY_CONFIG = config.my_config
  }

  dev {
    command = "node --watch index.js"
  }
}

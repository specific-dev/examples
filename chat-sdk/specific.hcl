build "bot" {
  base    = "node"
  command = "npx tsc"
}

service "bot" {
  build   = build.bot
  command = "node dist/index.js"

  endpoint {
    public = true
  }

  env = {
    PORT                 = port
    REDIS_URL            = redis.state.url
    SLACK_BOT_TOKEN      = secret.slack_bot_token
    SLACK_SIGNING_SECRET = secret.slack_signing_secret
  }
}

redis "state" {}

secret "slack_bot_token" {}
secret "slack_signing_secret" {}

build "app" {
  base    = "node"
  command = "npm install"
}

service "web" {
  build   = build.app
  command = "npm start"
  endpoint {
    public = true
  }

  env = {
    PORT                 = port
    DATABASE_URL         = postgres.main.url
    DATABASE_SYNC_URL    = postgres.main.sync.url
    DATABASE_SYNC_SECRET = postgres.main.sync.secret
  }

  dev {
    command = "npm run dev"
  }

  pre_deploy {
    command = "npm run db:migrate"
  }
}

postgres "main" {}

storage "files" {}

build "app" {
  base = "node"
}

service "app" {
  build = build.app
  command = "node index.js"

  endpoint {
    public = true
  }

  env = {
    PORT          = port
    S3_ENDPOINT   = storage.files.endpoint
    S3_ACCESS_KEY = storage.files.access_key
    S3_SECRET_KEY = storage.files.secret_key
    S3_BUCKET     = storage.files.bucket
  }

  dev {
    command = "node --watch index.js"
  }
}

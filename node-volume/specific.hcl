build "web" {
  base    = "node"
  command = "npm install"
}

service "web" {
  build   = build.web
  command = "npm start"

  endpoint {
    public = true
  }

  volume "data" {}

  env = {
    PORT     = port
    DATA_DIR = volume.data.path
  }

  dev {
    command = "npm run dev"
  }
}

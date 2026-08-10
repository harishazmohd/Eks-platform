terraform {
  backend "s3" {
    bucket       = "florence-dev-020139096715-ap-south-1"
    key          = "dev/terraform.tfstate"
    region       = "ap-south-1"
    use_lockfile = true
  }
}

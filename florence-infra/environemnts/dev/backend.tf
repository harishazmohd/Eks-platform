terraform {
  backend "s3" {
    bucket       = "florence-dev-683003725818-ap-south-1"
    key          = "dev/terraform.tfstate"
    region       = "ap-south-1"
    use_lockfile = true
  }
}

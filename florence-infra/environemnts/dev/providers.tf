provider "aws" {
  region = var.aws_region
  alias = "main_region"
  default_tags {
    tags = local.common_tags
  }
}
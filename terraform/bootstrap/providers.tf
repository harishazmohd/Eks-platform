// The bootstrap stack only creates AWS resources; the backend is configured
// after this stack has created the bucket.
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = local.common_tags
  }
}
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "account" {}

data "aws_partition" "partition" {}

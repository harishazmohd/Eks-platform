// Resolve account and region details used in repository and registry ARNs.
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
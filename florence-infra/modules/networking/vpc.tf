resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
  instance_tenancy = var.instance_tenancy
  enable_dns_support = var.dns_support
  enable_dns_hostnames = var.dns_hostnames

  assign_generated_ipv6_cidr_block = var.assign_generated_ipv6_cidr_block

  tags = merge(local.common_tags,
  {
    Names = local.names.vpc
  }
  )
}
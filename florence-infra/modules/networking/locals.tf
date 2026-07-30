locals {
  name_prefix = "${var.project_name}-${var.environment}"

  names = {
    vpc            = "${local.name_prefix}-vpc"
    igw            = "${local.name_prefix}-igw"
    nat            = "${local.name_prefix}-igw"
    public_rt      = "${local.name_prefix}-public-rt"
    private_app_rt = "${local.name_prefix}-private-app-rt"
    private_db_rt  = "${local.name_prefix}-db-rt"

  }
  # Subnet Collections
  public_subnets = {
    for name, subnet in var.subnets :
    name => subnet
    if subnet.type == "public"
  }

  app_subnets = {
    for name, subnet in var.subnets :
    name => subnet
    if subnet.type == "app"
  }

  database_subnets = {
    for name, subnet in var.subnets :
    name => subnet
    if subnet.type == "database"
  }

  # Availability Zone Lookup
  subnet_az = {
    for name, subnet in var.subnets :
    name => subnet.availability_zone
  }

  # CIDR Collections

  public_subnets_cidr = [
    for subnet in values(local.public_subnets) :
    subnet.cidr_block
  ]

  app_subnets_cidr = [
    for subnet in values(local.app_subnets) :
    subnet.cidr_block
  ]

  database_subnets_cidr = [
    for subnet in values(local.database_subnets) :
    subnet.cidr_block
  ]

  # NAT Gateway
  # nat_gateway_mode = var.single_nat_gateway ? "single" : "high-availability"
  nat_public_subnet = keys(local.public_subnets)[0]

  ipv6_enabled = var.assign_generated_ipv6_cidr_block

  common_tags = merge(var.common_tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.metadata.owner
      Repository  = var.metadata.repository
    }
  )
}
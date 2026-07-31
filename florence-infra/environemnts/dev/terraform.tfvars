project_name = "florence"
environment  = "dev"
aws_region   = "ap-south-1"
metadata = {
  owner      = "Haris"
  repository = "project-florence"
}

subnets = {

  public_a = {
    cidr_block    = "10.0.1.0/24"
    az_index      = 0
    type          = "public"
    map_public_ip = true
  }

  public_b = {
    cidr_block    = "10.0.2.0/24"
    az_index      = 1
    type          = "public"
    map_public_ip = true
  }

  app_a = {
    cidr_block    = "10.0.11.0/24"
    az_index      = 0
    type          = "app"
    map_public_ip = false
  }

  app_b = {
    cidr_block    = "10.0.12.0/24"
    az_index      = 1
    type          = "app"
    map_public_ip = false
  }

  database_a = {
    cidr_block    = "10.0.21.0/24"
    az_index      = 0
    type          = "database"
    map_public_ip = false
  }

  database_b = {
    cidr_block    = "10.0.22.0/24"
    az_index      = 1
    map_public_ip = false
    type          = "database"
  }

}
vpc_cidr_blocks = "10.0.0.0/16"

common_tags = {
  "CostCenter" = "Engineering"
}

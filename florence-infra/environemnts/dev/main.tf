module "vpc" {
  source             = "../../modules/networking"
  project_name       = var.project_name
  environment        = var.environment
  aws_region         = var.aws_region
  vpc_cidr           = var.vpc_cidr_blocks
  subnets            = local.subnets
  metadata           = var.metadata
  db_port            = 3306
  availability_zones = local.availability_zone
  common_tags        = local.common_tags
}

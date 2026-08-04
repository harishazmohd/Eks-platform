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

module "ecr" {
  source                   = "../../modules/ecr"
  project_name             = var.project_name
  environment              = var.environment
  aws_region               = var.aws_region
  repositories             = var.repositories
  encryption_configuration = var.encryption_configuration
  registry_config          = var.registry_config
  metadata                 = var.metadata
  common_tags              = local.common_tags
}

module "kms" {
  source = "../../modules/kms"
  project_name = var.project_name
  environment = var.environment
  aws_region = var.aws_region
  common_tags = local.common_tags
  metadata = var.metadata
  keys = var.keys
}
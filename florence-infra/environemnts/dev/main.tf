module "vpc" {
  source             = "../../modules/networking"
  project_name       = var.project_name
  environment        = var.environment
  aws_region         = var.aws_region
  vpc_cidr           = var.vpc_cidr_blocks
  subnets            = var.subnets
  metadata           = var.metadata
  availability_zones = local.availability_zone
  common_tags        = local.common_tags
}

module "security" {
  source             = "../../modules/security"
  project_name       = var.project_name
  environment        = var.environment
  aws_region         = var.aws_region
  database_sg_id     = module.vpc.security_groups_id.database
  vpc_endpoint_sg_id = module.vpc.security_groups_id.vpc_endpoint
  eks_cluster_sg_id  = module.eks.cluster_security_group_id
  db_port            = var.db_port
  metadata           = var.metadata
  common_tags        = local.common_tags
}

module "ecr" {
  source                   = "../../modules/ecr"
  project_name             = var.project_name
  environment              = var.environment
  aws_region               = var.aws_region
  repositories             = var.repositories
  encryption_configuration = local.encryption_configuration
  registry_config          = var.registry_config
  metadata                 = var.metadata
  common_tags              = local.common_tags
}

module "kms" {
  source       = "../../modules/kms"
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  common_tags  = local.common_tags
  metadata     = var.metadata
  keys         = var.keys
}

module "rds" {
  source                 = "../../modules/database"
  aws_region             = var.aws_region
  project_name           = var.project_name
  environment            = var.environment
  common_tags            = local.common_tags
  metadata               = var.metadata
  kms_key_id             = local.kms_keys.database
  vpc_id                 = local.vpc_id
  security_group_ids     = [local.security_group_ids.db]
  subnet_ids             = module.vpc.database_subnet_ids
  parameter_group_config = var.parameter_group_config
  database_config        = local.db_config
}

module "eks" {
  source         = "../../modules/eks"
  project_name   = var.project_name
  environment    = var.environment
  metadata       = var.metadata
  common_tags    = var.common_tags
  cluster_config = local.eks_cluster_config
  node_config    = local.node_group_config
  kms_key_arn    = local.kms_keys.eks
  addons_config  = local.addons_config
}

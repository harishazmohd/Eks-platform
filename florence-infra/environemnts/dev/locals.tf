locals {
  name_prefix       = "${var.project_name}-${var.environment}"
  availability_zone = data.aws_availability_zones.available.names

  # Network Configuration
  vpc_id = module.vpc.vpc_id
  security_group_ids = {
    db  = module.vpc.security_groups_id.database
    alb = module.vpc.security_groups_id.alb
  }

  # KMS Keys
  kms_keys = {
    ecr      = module.kms.kms["ecr"].arn
    database = module.kms.kms["rds"].arn
    eks      = module.kms.kms["eks"].arn
  }

  encryption_configuration = {
    encryption_type = "KMS"
    kms_key         = local.kms_keys.ecr
  }


  # Database configuration
  db_config = {
    instance_config = {
      db_name        = "florencedb"
      identifier     = "${local.name_prefix}-postgres"
      engine         = "postgres"
      engine_version = "18.3"
      instance_class = "db.t4g.micro"
    }
    credentials_config = {
      username = "florenceadmin"
    }

    storage_config = {
      allocated_storage     = 20
      max_allocated_storage = 100
      storage_type          = "gp3"
      storage_encrypted     = true
    }

    multi_az                     = true
    backup_retention_period      = 1
    deletion_protection          = false
    maintenance_window           = "Sun:04:30-Sun:05:30"
    performance_insights_enabled = true
    monitoring_interval          = 60
    auto_minor_version_upgrade   = true
    apply_immediately            = false
    skip_final_snapshot          = true

    port                = var.db_port
    publicly_accessible = false
  }

  # EKS Cluster Configuration
  eks_cluster_config = {
    subnet_ids      = module.vpc.app_subnet_ids
    cluster_name    = "${local.name_prefix}-cluster"
    cluster_version = "1.35"
    cluster_endpoint_config = {
      endpoint_private_access = true
      endpoint_public_access  = true
    }
    enable_cluster_logging_types = [
      "api",
      "audit",
      "authenticator",
      "controllerManager",
      "scheduler"
    ]
  }

  node_group_config = {
    private_subnet_ids = module.vpc.app_subnet_ids
    node_instance_type = ["c7i-flex.large"]
    capacity_type      = ["ON_DEMAND"]
    node_min_size      = 2
    node_max_size      = 4
    node_desired_size  = 2

    disk_size = 50
    node_labels = {
      workload = "general"
    }
  }

  addons_config = {
    "vpc_cni" = {
      addon_name                  = "vpc-cni"
      addon_version               = "v1.22.4-eksbuild.3"
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
    "coredns" = {
      addon_name                  = "coredns"
      addon_version               = "v1.14.3-eksbuild.3"
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
    "kube_proxy" = {
      addon_name                  = "kube-proxy"
      addon_version               = "v1.35.3-eksbuild.13"
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
  }

  # Tags & Metadata
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



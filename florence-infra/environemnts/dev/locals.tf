locals {
  name_prefix = "${var.project_name}-${var.environment}"

  availability_zone = data.aws_availability_zones.available.names


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

  vpc_id = module.vpc.vpc_id
  security_group_ids = {
    db = module.vpc.security_groups_id.db
    app = module.vpc.security_groups_id.app
    alb = module.vpc.security_groups_id.alb
  }

  kms_keys = {
    ecr = module.kms.kms["ecr"].arn
    database = module.kms.kms["rds"].arn
  }
 
  encryption_configuration = {
    encryption_type = "KMS"
    kms_key         = local.kms_keys.ecr
  }


  # Database configuration
  db_config ={
    instance_config = {
      db_name = "florencedb"
      identifier = "${local.name_prefix}-postgres"
      engine = "postgres"
      engine_version = "17.4"
      instance_class = "db.t4g.micro"
    }
    credentials_config = {
      username = "florenceadmin"
    }

    storage_config = {
      allocated_storage = 20
      max_allocated_storage = 100
      storage_type = "gp3"
      storage_encrypted = true
      iops = 3000
    }

    multi_az = true
    backup_retention_period = 7
    deletion_protection = false
    maintenance_window = "Sun:04:30-Sun:05:30"
    performance_insights_enabled = true
    monitoring_interval = 60
    auto_minor_version_upgrade = true
    apply_immediately = false
    skip_final_snapshot = true

    port = 5432
    publicly_accessible = false
  }
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

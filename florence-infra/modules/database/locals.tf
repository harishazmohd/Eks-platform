locals {
  name_prefix = "${var.project_name}-${var.environment}"

  names = {
    security_group  = "${local.name_prefix}-sg"
    subnet          = "${local.name_prefix}-subnet-group"
    parameter_group = "${local.name_prefix}-parameter-group"
    option_group    = "${local.name_prefix}-option-group"
    database        = "${local.name_prefix}-postgres-database"
    monitoring      = "${local.name_prefix}-rds-monitoring-role"
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
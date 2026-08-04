locals {
  name_prefix = "${var.project_name}-${var.environment}"

  names = {
    alias_names = {
      for name, alias in var.keys :
      name => "alias/${local.name_prefix}-${name}"
    }
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
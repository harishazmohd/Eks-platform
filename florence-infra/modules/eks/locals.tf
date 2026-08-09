locals {
  name_prefix = "${var.project_name}-${var.environment}"
  names = {
    eks_cluster_role = "${local.name_prefix}-eks-cluster-role"
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
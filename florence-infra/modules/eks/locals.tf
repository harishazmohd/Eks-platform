locals {
  name_prefix = "${var.project_name}-${var.environment}"
  names = {
    eks_cluster_role = "${local.name_prefix}-eks-cluster-role"
  }

  eks_config = {
    cluster_name    = var.cluster_name
    cluster_version = var.cluster_version
    cluster_endpoint_config = object({
      endpoint_private_access = var.cluster_endpoint_config.endpoint_private_access
      endpoint_public_access  = var.cluster_endpoint_config.endpoint_public_access
    })
    cluster_logging_config = object({
      enable_cluster_logging_types = var.enable_cluster_logging_types
    })
    kms_encryption_config = object({
      name = var.kms_key_arn
    })
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

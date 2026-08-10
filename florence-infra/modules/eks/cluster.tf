resource "aws_eks_cluster" "this" {
  name     = local.names.eks_cluster_name
  role_arn = aws_iam_role.this["cluster_role"].arn
  version  = var.cluster_config.cluster_version
  encryption_config {
    provider {
      key_arn = var.kms_key_arn
    }
    resources = ["secrets"]
  }

  vpc_config {
    subnet_ids              = var.cluster_config.subnet_ids
    endpoint_private_access = var.cluster_config.cluster_endpoint_config.endpoint_private_access
    endpoint_public_access  = var.cluster_config.cluster_endpoint_config.endpoint_public_access
  }
  enabled_cluster_log_types = var.cluster_config.enable_cluster_logging_types
  tags = merge(local.common_tags, {
    Name               = local.names.eks_cluster_name
    kubernetes_version = var.cluster_config.cluster_version
  })
}

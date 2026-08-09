resource "aws_eks_cluster" "this" {
  name     = local.eks_config.cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = local.eks_config.cluster_version
  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = local.eks_config.cluster_endpoint_config.endpoint_private_access
    endpoint_public_access  = local.eks_config.cluster_endpoint_config.endpoint_public_access
  }
  enabled_cluster_log_types = local.eks_config.cluster_logging_config.enable_cluster_logging_types
  tags = merge(local.common_tags, {
    Name               = local.eks_config.cluster_name
    kubernetes_version = local.eks_config.cluster_version
  })
}

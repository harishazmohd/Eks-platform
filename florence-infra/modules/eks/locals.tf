locals {
  name_prefix = "${var.project_name}-${var.environment}"
  names = {
    eks_cluster_role = "${local.name_prefix}-eks-cluster-role"
    eks_cluster_name = var.cluster_config.cluster_name
    node_group_name  = "${local.name_prefix}-node-group"
  }

  role_config = {
    cluster_role = {
      name        = "${local.name_prefix}-eks-cluster-role"
      role_policy = data.aws_iam_policy_document.eks_cluster_assume_role.json
      policy_arns = ["AmazonEKSClusterPolicy"]
    }
    node_group_role = {
      name        = "${local.name_prefix}-eks-node-group-role"
      role_policy = data.aws_iam_policy_document.node_group_assume_role.json
      policy_arns = ["AmazonEKSWorkerNodePolicy", "AmazonEC2ContainerRegistryReadOnly", "AmazonEKS_CNI_Policy"]
    }
  }

  iam_role_attachment = {
    for attachment in flatten([
      for role_key, role_config in local.role_config : [
        for policy in role_config.policy_arns : {
          key        = "${role_key}-${policy}"
          role_key   = role_key
          policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/${policy}"
        }
      ]
    ]) : attachment.key => attachment
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

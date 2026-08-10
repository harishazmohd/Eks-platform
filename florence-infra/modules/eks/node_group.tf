resource "aws_eks_node_group" "this" {
  node_group_name = local.names.node_group_name
  cluster_name    = aws_eks_cluster.this.name
  subnet_ids      = var.node_config.private_subnet_ids
  node_role_arn   = aws_iam_role.this["node_group_role"].arn

  instance_types = var.node_config.node_instance_type
  capacity_type  = var.node_config.capacity_type[0]

  disk_size = var.node_config.disk_size

  labels = var.node_config.node_labels

  scaling_config {
    desired_size = var.node_config.node_desired_size
    min_size     = var.node_config.node_min_size
    max_size     = var.node_config.node_max_size
  }

  tags = merge(local.common_tags, {
    Name = local.names.node_group_name

  })
}

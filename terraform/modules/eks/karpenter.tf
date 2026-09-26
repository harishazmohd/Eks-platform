// Instance profile used by EC2 nodes provisioned by Karpenter.
resource "aws_iam_instance_profile" "karpenter_node" {
  name = local.names.karpenter_node_profile
  role = aws_iam_role.karpenter_node.name
  tags = merge(local.common_tags, {
    Name = local.names.karpenter_node_profile
  })
}

// Register the Karpenter node role with the EKS access API.
resource "aws_eks_access_entry" "karpenter_node" {
  cluster_name = aws_eks_cluster.this.name
  principal_arn = aws_iam_role.karpenter_node.arn
  type = "EC2_LINUX"
  depends_on = [aws_eks_cluster.this]
}

// Discovery tag lets Karpenter identify the cluster security group.
resource "aws_ec2_tag" "karpenter_node" {
  resource_id = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
  key = "karpenter.sh/discovery"
  value = aws_eks_cluster.this.name
}
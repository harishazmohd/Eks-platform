resource "aws_iam_role" "eks_cluster_role" {
  name               = local.names.eks_cluster_role
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_assume_role.json
  tags = merge(local.common_tags, {
    Name = local.names.eks_cluster_role
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:${data.aws_partition.current.partition}::iam:aws:policy/AmazonEKSClusterPolicy"
}
output "cluster" {
  description = "Cluster outputs"
  value = {
    cluster_name               = aws_eks_cluster.this.name
    cluster_arn                = aws_eks_cluster.this.arn
    cluster_endpoint           = aws_eks_cluster.this.endpoint
    certificate_authority_data = aws_eks_cluster.this.certificate_authority[0].data
    security_group_id          = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
  }
}

output "node_group" {
  description = "Node group outputs"
  value = {
    node_group_name = aws_eks_node_group.this.node_group_name

  }
}

output "node_group_sg" {
  description = "Node group security group ID"
  value       = aws_eks_cluster.this.vpc_config[0].security_group_ids
}

output "cluster_security_group_id" {
  description = "AWS-managed EKS cluster security group ID representing workload traffic"
  value       = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}


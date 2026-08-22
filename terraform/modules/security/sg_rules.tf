# Cross-Component Security Relationships

# EKS Workloads -> Database PostgreSQL
resource "aws_vpc_security_group_ingress_rule" "database_postgres_from_eks" {
  security_group_id            = var.database_sg_id
  referenced_security_group_id = var.eks_cluster_sg_id
  ip_protocol                  = "tcp"

  from_port = var.db_port
  to_port   = var.db_port

  description = "Allow PostgreSQL traffic from EKS workload"
}

# EKS Workloads -> VPC Endpoints HTTPS
resource "aws_vpc_security_group_ingress_rule" "vpc_endpoint_https_from_eks" {
  security_group_id            = var.vpc_endpoint_sg_id
  referenced_security_group_id = var.eks_cluster_sg_id
  ip_protocol                  = "tcp"

  from_port = 443
  to_port   = 443

  description = "Allow HTTPS traffic from EKS workload to VPC endpoints"
}

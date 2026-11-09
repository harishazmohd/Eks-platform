resource "aws_security_group" "backend_pods" {
  name        = "${local.name_prefix}-backend-pods"
  description = "Network access for BankApp backend pods"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-pods"
  })
}

resource "aws_vpc_security_group_ingress_rule" "backend_pods_from_nodes" {
  security_group_id            = aws_security_group.backend_pods.id
  referenced_security_group_id = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  description                  = "Allow cluster workloads to reach backend pods"
}

resource "aws_vpc_security_group_egress_rule" "backend_pods_to_database" {
  for_each = toset(var.database_subnet_cidrs)

  security_group_id = aws_security_group.backend_pods.id
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  description       = "Allow backend pods to reach PostgreSQL in database subnets"
}

resource "aws_vpc_security_group_egress_rule" "backend_pods_to_dns" {
  for_each = toset(["udp", "tcp"])

  security_group_id = aws_security_group.backend_pods.id
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = each.value
  from_port         = 53
  to_port           = 53
  description       = "Allow backend pod DNS resolution"
}

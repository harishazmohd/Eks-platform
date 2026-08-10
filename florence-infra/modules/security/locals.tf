locals {
  name_prefix     = "${var.project_name}-${var.environment}"
  db_port         = var.db_port
  internet_cidr   = "0.0.0.0/0"
  tcp_ip_protocol = "tcp"
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

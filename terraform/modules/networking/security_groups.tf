# Foundational Security Groups

resource "aws_security_group" "alb" {
  name        = local.names.alb
  description = "Security group for ALB"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = local.names.alb
  })
}

resource "aws_security_group" "database" {
  name        = local.names.database
  description = "Security group for Database"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = local.names.database
  })
}

resource "aws_security_group" "bastion" {
  name        = local.names.bastion
  description = "Security Group for bastion hosts"
  vpc_id      = aws_vpc.this.id

  tags = merge(
    local.common_tags,
    {
      Name = local.names.bastion
    }
  )
}

resource "aws_security_group" "vpc_endpoint" {
  name        = local.names.vpc_endpoint
  description = "Security Group for Interface VPC Endpoints"
  vpc_id      = aws_vpc.this.id

  tags = merge(
    local.common_tags,
    {
      Name = local.names.vpc_endpoint
    }
  )
}

# ALB Foundational Ingress Rules

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = local.tcp_ip_protocol

  cidr_ipv4 = local.internet_cidr
  from_port = 80
  to_port   = 80

  description = "Allows HTTP traffic from Internet"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = local.tcp_ip_protocol

  cidr_ipv4 = local.internet_cidr
  from_port = 443
  to_port   = 443

  description = "Allows HTTPS traffic from Internet"
}

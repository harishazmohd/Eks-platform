# ALB SG RULES

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  ip_protocol = local.tcp_ip_protocol

  cidr_ipv4 = local.internet_cidr
  from_port = 80
  to_port = 80

  description = "Allows HTTP traffic from Internet"
}

# ALB SG RULES

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  ip_protocol = local.tcp_ip_protocol

  cidr_ipv4 = local.internet_cidr
  from_port = 443
  to_port = 443

  description = "Allows HTTPS traffic from Internet"
}


# Application SG Rules

resource "aws_vpc_security_group_ingress_rule" "application_from_alb" {
  security_group_id = aws_security_group.application.id
  ip_protocol = local.tcp_ip_protocol
  referenced_security_group_id = aws_security_group.alb.id

  from_port = 3000
  to_port = 3000

  description = "Allow application traffic from ALB"
}

resource "aws_vpc_security_group_ingress_rule" "application_ssh" {
  security_group_id = aws_security_group.application.id
  referenced_security_group_id = aws_security_group.bastion.id

  ip_protocol = local.tcp_ip_protocol
  from_port = 22
  to_port   = 22
  description = "Allow SSH from Bastion Host"
}

resource "aws_vpc_security_group_ingress_rule" "database_mysql" {
  security_group_id = aws_security_group.database.id
  referenced_security_group_id = aws_security_group.application.id
  ip_protocol = "tcp"

  from_port = local.db_port
  to_port   = local.db_port

  description = "Allow MySQL traffic from application"
}
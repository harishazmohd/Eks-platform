resource "aws_network_acl_rule" "http" {
  network_acl_id = aws_network_acl.public.id
  egress         = false
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 80
  to_port        = 80
}


resource "aws_network_acl_rule" "https" {
  network_acl_id = aws_network_acl.public.id
  egress         = false
  rule_number    = 110
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.internet_cidr
  from_port      = 443
  to_port        = 443
}


resource "aws_network_acl_rule" "public_ingress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  egress         = false
  rule_number    = 120
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.internet_cidr
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_egress_all" {
  network_acl_id = aws_network_acl.public.id
  egress         = true
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = local.internet_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "app_ingress_vpc" {
  network_acl_id = aws_network_acl.application.id
  egress         = false
  rule_action    = "allow"
  rule_number    = 100
  protocol       = "-1"
  cidr_block     = local.internet_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "app_egress_vpc" {
  network_acl_id = aws_network_acl.application.id
  egress         = true
  rule_action    = "allow"
  rule_number    = 100
  protocol       = "-1"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "database_ingress_vpc" {
  network_acl_id = aws_network_acl.database.id
  egress         = false
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "database_egress_vpc" {
  network_acl_id = aws_network_acl.database.id
  egress         = true
  rule_number    = 100
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

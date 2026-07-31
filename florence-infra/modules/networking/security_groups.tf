resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "application" {
  name        = "${local.name_prefix}-app-sg"
  description = "Security group for Application"
  vpc_id      = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-db-sg"
  description = "Security group for Database"
  vpc_id      = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-sg"
  })
}

resource "aws_security_group" "bastion" {
  name        = "${local.name_prefix}-bastion-sg"
  description = "Security Group for bastion hosts"
  vpc_id      = aws_vpc.this.id
  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-bastion-sg"
    }
  )
}

resource "aws_security_group" "vpc_endpoint" {
  name        = local.names.vpc_endpoint
  description = "Security Group for Interface VPC Endpoints"

  vpc_id = aws_vpc.this.id
  tags = merge(
    local.common_tags,
    {
      Name = local.names.vpc_endpoint
    }
  )

}
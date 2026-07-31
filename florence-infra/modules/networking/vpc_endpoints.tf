resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.this.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.application.id,
    aws_route_table.private_route_database.id
  ]
  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-s3-endpoint"
    }
  )
}


resource "aws_vpc_endpoint" "interface" {
  for_each          = local.interface_endpoints
  vpc_id            = aws_vpc.this.id
  vpc_endpoint_type = "Interface"

  service_name = "com.amazonaws.${var.aws_region}.${each.value}"

  subnet_ids = [
    for name, subnet in local.local.app_subnets :
    aws_subnet.this[name].id
  ]

  security_group_ids = [
    aws_security_group.vpc_endpoint.id
  ]

  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${replace(each.value, ".", "-")}-vpce"
    }
  )
}
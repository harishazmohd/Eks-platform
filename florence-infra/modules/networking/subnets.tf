resource "aws_subnet" "this" {
  for_each                = var.subnets
  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr_block
  availability_zone       = var.availability_zones[each.value.az_index]
  map_public_ip_on_launch = each.value.map_public_ip
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${each.key}"
    Type = each.value.type
  })
}
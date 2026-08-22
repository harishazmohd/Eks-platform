resource "aws_subnet" "this" {
  for_each                = var.subnets
  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr_block
  availability_zone       = var.availability_zones[each.value.az_index]
  map_public_ip_on_launch = each.value.map_public_ip
  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-${each.key}"
      Type = each.value.type
    },
    each.value.type == "public" ? {
      "kubernetes.io/role/elb"                             = "1"
      "kubernetes.io/cluster/${local.name_prefix}-cluster" = "shared"
    } : {},
    each.value.type == "app" ? {
      "kubernetes.io/role/internal-elb"                    = "1"
      "kubernetes.io/cluster/${local.name_prefix}-cluster" = "shared"
    } : {}
  )
}
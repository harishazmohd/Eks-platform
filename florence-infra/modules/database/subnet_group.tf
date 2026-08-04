resource "aws_db_subnet_group" "this" {
  name = local.names.subnet
  description = "Subnet group for ${local.name_prefix} database"
  subnet_ids = var.subnet_ids
  tags = merge(local.common_tags, {
    Name = local.names.subnet
  })
}
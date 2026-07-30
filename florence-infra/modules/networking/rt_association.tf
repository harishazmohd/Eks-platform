resource "aws_route_table_association" "public" {
  for_each       = local.public_subnets
  subnet_id      = aws_subnet.this[each.key].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "application" {
  for_each       = local.public_subnets
  subnet_id      = aws_subnet.this[each.key].id
  route_table_id = aws_route_table.application.id
}

resource "aws_route_table_association" "database" {
  for_each       = local.database_subnets
  subnet_id      = aws_subnet.this[each.key].id
  route_table_id = aws_route_table.private_route_database.id
}


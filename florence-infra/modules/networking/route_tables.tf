# Public Route tables

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = local.names.public_rt
  })
}


resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}


# Application Route Table

resource "aws_route_table" "application" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = local.names.private_app_rt
  })
}

resource "aws_route" "private_route_app" {
  route_table_id         = aws_route_table.application.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_nat_gateway.this.id
}

# Database Route table

resource "aws_route_table" "private_route_database" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = local.names.private_db_rt
  })
}

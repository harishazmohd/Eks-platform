resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.this.id
    subnet_ids = [
        for name, subnet in local.public_subnets :
        aws_subnet.this[name].id
    ]

    tags = merge(local.common_tags, {
        Name = local.names.public_nacls
    })
}

resource "aws_network_acl" "application" {
  vpc_id = aws_vpc.this.id
    subnet_ids = [
        for name, subnet in local.app_subnets :
        aws_subnet.this[name].id
    ]

    tags = merge(local.common_tags, {
        Name = local.names.app_nacls
    })
}

resource "aws_network_acl" "database" {
  vpc_id = aws_vpc.this.id
    subnet_ids = [
        for name, subnet in local.database_subnets :
        aws_subnet.this[name].id
    ]

    tags = merge(local.common_tags, {
        Name = local.names.db_nacls
    })
}

output "vpc_id" {
  description = "The ID of the VPC"
  value = aws_vpc.this.id
}


output "public_subnet_ids" {
  description = "The Ids of the public subnets"
  value = [
    for name, subnet in local.public_subnets :
    aws_subnet.this[name].id
  ]
}


output "app_subnet_ids" {
  description = "The Ids of the application subnets"
  value = [
    for name, subnet in local.app_subnets :
    aws_subnet.this[name].id
  ]
}


output "database_subnet_ids" {
  description = "The Ids of the database subnets"
  value = [
    for name, subnet in local.database_subnets :
    aws_subnet.this[name].id
  ]
}   

output "public_route_table_id" {
  description = "The ID of the public route table"
  value = aws_route_table.public.id
}

output "application_route_table_id" {
  description = "The ID of the application route table"
  value = aws_route_table.application.id
}

output "database_route_table_id" {
  description = "The ID of the database route table"
  value = aws_route_table.private_route_database.id
}

output "gateways_id" {
  description = "The ID of the gateways"
  value = {
    igw = aws_internet_gateway.this.id
    nat = aws_nat_gateway.this.id
  }
}


output "security_groups_id" {
    description = "The ID of the security groups"
    value = {
        alb = aws_security_group.alb.id
        app = aws_security_group.app.id
        db  = aws_security_group.db.id
        bastion = aws_security_group.bastion.id
        endpoint = aws_security_group.vpc_endpoint.id
    }
}


output "gateway_endpoints_id" {
    description = "The ID of the VPC endpoints"
    value =  aws_vpc_endpoint.s3.id
}

output "interface_endpoints_id" {
    description = "The ID of the VPC interface endpoints"
    value = {
        for name, endpoint in aws_vpc_endpoint.interface :
        name => endpoint.id
    }
}
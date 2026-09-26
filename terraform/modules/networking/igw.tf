// Public subnets use the internet gateway for edge traffic.
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.common_tags, {
    Name = local.names.igw
  })
}
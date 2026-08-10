
resource "aws_iam_role" "this" {
  for_each           = local.role_config
  name               = each.value.name
  assume_role_policy = each.value.role_policy
  tags = merge(local.common_tags, {
    Name = each.value.name
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  for_each   = local.iam_role_attachment
  role       = aws_iam_role.this[each.value.role_key].name
  policy_arn = each.value.policy_arn
}

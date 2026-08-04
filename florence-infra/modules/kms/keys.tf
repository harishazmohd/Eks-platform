resource "aws_kms_key" "this" {
  for_each                 = var.keys
  description              = each.value.description
  enable_key_rotation      = each.value.enable_key_rotation
  deletion_window_in_days  = each.value.deletion_window_in_days
  multi_region             = each.value.multi_region
  key_usage                = each.value.key_usage
  customer_master_key_spec = each.value.customer_master_key_spec
  policy = data.aws_iam_policy_document.kms[each.key].json
  tags = merge(local.common_tags, {
    Name = local.names.alias_names[each.key]
    Key  = each.key
  })
}

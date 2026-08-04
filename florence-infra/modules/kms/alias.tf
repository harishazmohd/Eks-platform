resource "aws_kms_alias" "this" {
  for_each = var.keys
  name = local.names.alias_names[each.key]
  target_key_id = aws_kms_key.this[each.key].key_id
}
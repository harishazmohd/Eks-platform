resource "aws_db_parameter_group" "this" {
  name        = local.names.parameter_group
  family      = var.parameter_group_config.family
  description = "Parameter group for ${local.name_prefix}"
  dynamic "parameter" {
    for_each = var.parameter_group_config.parameters
    content {
      name         = parameter.key
      value        = parameter.value.value
      apply_method = parameter.value.apply_method
    }
  }
  tags = merge(local.common_tags, {
    Name = local.names.parameter_group
  })
}
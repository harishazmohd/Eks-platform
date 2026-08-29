resource "aws_ecr_repository" "this" {
  for_each             = var.repositories
  name                 = "${local.name_prefix}-${each.key}"
  force_delete         = true
  image_tag_mutability = each.value.image_tag_mutability
  encryption_configuration {
    encryption_type = var.encryption_configuration.encryption_type
    kms_key = (
      var.encryption_configuration.encryption_type == "KMS"
      ? var.encryption_configuration.kms_key
      : null
    )
  }
  tags = merge(
    local.common_tags,
    {
      Name    = "${local.name_prefix}-${each.key}"
      Service = each.key
    }
  )
}

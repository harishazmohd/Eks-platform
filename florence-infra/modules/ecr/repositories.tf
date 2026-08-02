resource "aws_ecr_repository" "this" {
  for_each             = toset(var.repositories)
  name                 = "${var.project_name}-${var.environment}-${each.value}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(
    var.common_tags,
    {
      Name    = "${var.project_name}-${var.environment}-${each.value}"
      Service = each.value
    }
  )
}

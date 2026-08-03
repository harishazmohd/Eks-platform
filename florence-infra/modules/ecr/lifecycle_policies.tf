resource "aws_ecr_lifecycle_policy" "this" {
  for_each = var.repositories
  repository = aws_ecr_repository.this[each.key].name
  policy = jsonencode({
    rulePriority = 1
    description = "Keep latest images"
    selection = {
        tagStatus = "any"
        countType = "imageCountMoreThan"
        countNumber = each.value.keep_last_images
    }
    action = {
        type = "expire"
    }
  })
}
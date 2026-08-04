resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = var.repositories
  repository = aws_ecr_repository.this[each.key].name
  policy     = <<POLICY
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Retain the newest images in each repository so deployments can roll back without keeping an unbounded history.",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": ${each.value.keep_last_images}
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
POLICY
}
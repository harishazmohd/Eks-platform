output "repositories" {
  description = "Repositories configuration"
  value = {
    for repo, values in aws_ecr_repository.this : repo => {
      id = values.id
      name = values.name
      arn = values.arn
      registry_id = values.registry_id
      repository_url = values.repository_url
      image_uri = "${values.repository_url}:latest"
    }
  }
}
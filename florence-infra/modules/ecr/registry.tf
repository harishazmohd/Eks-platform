resource "aws_ecr_registry_scanning_configuration" "this" {
  scan_type = var.registry_config.scan_type
  rule {
    scan_frequency = var.registry_config.scan_frequency
    repository_filter {
      filter = var.registry_config.repository_filter
      filter_type = var.registry_config.repository_filter_type
    }
  }
}
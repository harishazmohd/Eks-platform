resource "aws_ecr_registry_scanning_configuration" "this" {
  scan_type = var.registry_config.scan_type
  dynamic "rule" {
    for_each = var.registry_config.scan_type == "ENHANCED" ? [var.registry_config] : []

    content {
      scan_frequency = rule.value.scan_frequency
      repository_filter {
        filter      = rule.value.repository_filter
        filter_type = rule.value.repository_filter_type
      }
    }
  }
}
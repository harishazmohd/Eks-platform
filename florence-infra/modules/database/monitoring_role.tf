resource "aws_iam_role" "monitoring" {
  name               = local.names.monitoring
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume_role.json
  tags = merge(local.common_tags, {
    Name = local.names.monitoring
  })
}

resource "aws_iam_role_policy_attachment" "monitoring" {
  role       = aws_iam_role.monitoring.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
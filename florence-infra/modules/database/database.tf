resource "aws_db_instance" "this" {
  db_name =        var.database_config.instance_config.db_name
  identifier     = var.database_config.instance_config.identifier
  engine         = var.database_config.instance_config.engine
  engine_version = var.database_config.instance_config.engine_version
  instance_class = var.database_config.instance_config.instance_class


  allocated_storage     = var.database_config.storage_config.allocated_storage
  max_allocated_storage = var.database_config.storage_config.max_allocated_storage
  storage_type          = var.database_config.storage_config.storage_type
  storage_encrypted     = var.database_config.storage_config.storage_encrypted
  iops                  = var.database_config.storage_config.iops
  parameter_group_name = aws_db_parameter_group.this.name

  port                   = var.database_config.port
  publicly_accessible    = var.database_config.publicly_accessible
  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name = aws_db_subnet_group.this.name

  monitoring_role_arn = aws_iam_role.monitoring.arn
  iam_database_authentication_enabled = true

  username = var.database_config.credentials_config.username  
  master_user_secret_kms_key_id = var.kms_key_id
  manage_master_user_password   = true
  kms_key_id                    = var.kms_key_id

  multi_az = var.database_config.multi_az

  backup_retention_period = var.database_config.backup_retention_period
  deletion_protection     = var.database_config.deletion_protection
  maintenance_window      = var.database_config.maintenance_window

  performance_insights_enabled = var.database_config.performance_insights_enabled
  performance_insights_kms_key_id = var.kms_key_id
  monitoring_interval          = var.database_config.monitoring_interval
  auto_minor_version_upgrade   = var.database_config.auto_minor_version_upgrade
  apply_immediately            = var.database_config.apply_immediately
  copy_tags_to_snapshot        = true
  skip_final_snapshot          = var.database_config.skip_final_snapshot
  final_snapshot_identifier = "${var.database_config.instance_config.identifier}-final-snapshot"
    
   enabled_cloudwatch_logs_exports = [
     "postgresql",
     "upgrade"
    ]

  lifecycle {
    ignore_changes = [ engine_version ]
  }

  tags = merge(local.common_tags, {
    Name = var.database_config.instance_config.identifier
  })
}
output "rds" {
  description = "Amazon RDS resources"
  value = {
    instance = {
      id                   = aws_db_instance.this.id
      arn                  = aws_db_instance.this.arn
      identifier           = aws_db_instance.this.identifier
      resource_id          = aws_db_instance.this.resource_id
      endpoint             = aws_db_instance.this.endpoint
      address              = aws_db_instance.this.address
      port                 = aws_db_instance.this.port
      status               = aws_db_instance.this.status
      instance_class       = aws_db_instance.this.instance_class
      username             = aws_db_instance.this.username
    }
    subnet_group = {
      id   = aws_db_subnet_group.this.id
      name = aws_db_subnet_group.this.name
      arn  = aws_db_subnet_group.this.arn
    }
    secrets_manager_arn = aws_secretsmanager_secret.database.arn
  }
}

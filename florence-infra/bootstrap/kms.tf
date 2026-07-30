resource "aws_kms_key" "backend_encryption_key" {
  description             = "KMS key for s3 backend-bucket for this project"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "s3_kms_alias" {
  target_key_id = aws_kms_key.backend_encryption_key.id
  name          = "alias/${local.name_prefix}-s3-kms-alias"
}
resource "aws_s3_bucket" "backend_bucket" {
  bucket        = "${local.name_prefix}-${data.aws_caller_identity.account_info.account_id}-${var.aws_region}"
  force_destroy = true
  tags          = local.common_tags
}


resource "aws_s3_bucket_versioning" "backend_versioning" {
  bucket = aws_s3_bucket.backend_bucket.id
  versioning_configuration {
    status = "Enabled"
  }

}

resource "aws_s3_bucket_public_access_block" "backend_access" {
  bucket = aws_s3_bucket.backend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


resource "aws_s3_bucket_server_side_encryption_configuration" "backend_encryption" {
  bucket = aws_s3_bucket.backend_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backend_encryption_key.id
      sse_algorithm     = "aws:kms"
    }
  }
}
output "bucket_name" {
  value = aws_s3_bucket.backend_bucket.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.backend_bucket.arn
}

output "bucket_id" {
  value = aws_s3_bucket.backend_bucket.id
}

output "kms_arn" {
  value = aws_kms_alias.s3_kms_alias.arn
}
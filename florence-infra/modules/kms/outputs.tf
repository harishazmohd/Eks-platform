output "kms" {
  description = "AWS KMS resources"
  value = {
      for name, key in aws_kms_key.this :
      name => {
        id          = key.id
        arn         = key.arn
        key_id      = key.key_id
        alias       = aws_kms_alias.this[name].name
        description = key.description
      }
  }
}
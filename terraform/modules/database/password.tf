resource "random_password" "rds_password" {
  length           = 24
  special          = true
  override_special = "@#$%^&*()_+"
}

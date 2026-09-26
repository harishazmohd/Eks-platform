// Generate the database password instead of storing a plaintext value in tfvars.
resource "random_password" "rds_password" {
  length           = 24
  special          = true
  override_special = "#$%^&*()_+"
}

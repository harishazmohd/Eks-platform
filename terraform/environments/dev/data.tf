// Resolve available zones dynamically so the environment is portable between
// AWS accounts where zone suffixes can differ.
data "aws_availability_zones" "available" {
  state = "available"
}

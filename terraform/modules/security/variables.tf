variable "project_name" {
  description = "Name of the project goes here"
  type        = string
}

variable "environment" {
  description = "Environment of the project"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment can only be: dev, prod or staging"
  }
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "database_sg_id" {
  description = "Database Security Group ID"
  type        = string
}

variable "vpc_endpoint_sg_id" {
  description = "VPC Endpoint Security Group ID"
  type        = string
}

variable "eks_cluster_sg_id" {
  description = "EKS cluster security group ID representing workload traffic"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "metadata" {
  description = "Metadata for the AWS resources"
  type = object({
    owner      = string
    repository = string
  })
}

variable "common_tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
  default     = {}
}

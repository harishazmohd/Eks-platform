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

variable "vpc_id" {
  description = "AWS VPC id"
  type        = string
}

variable "cluster_config" {
  description = "EKS Cluster configuration"
  type = object({
    subnet_ids      = list(string)
    cluster_name    = string
    cluster_version = string
    cluster_endpoint_config = object({
      endpoint_private_access = bool
      endpoint_public_access  = bool
    })
    enable_cluster_logging_types = list(string)
  })
}

variable "kms_key_arn" {
  description = "KMS Key ARN"
  type        = string
}

variable "node_config" {
  description = "Node group configuration"
  type = object({
    private_subnet_ids = list(string)
    node_instance_type = list(string)
    capacity_type      = list(string)
    node_min_size      = number
    node_max_size      = number
    node_desired_size  = number

    disk_size   = number
    node_labels = map(string)
  })
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

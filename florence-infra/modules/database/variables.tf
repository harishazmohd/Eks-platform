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
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Map of subnets used in this project"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Map of security groups used in this project"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS Key for the database"
  type        = string
}

variable "database_config" {
  description = "Database configuration"
  type = object({
    instance_config = {
      instance_class = string
      engine         = string
      engine_version = string
    }
    storage_config = {
      allocated_storage     = number
      max_allocated_storage = optional(number)
      storage_type          = string
      storage_encrypted     = bool
      iops                  = optional(number)
    }
    multiaz                      = bool
    backup_retention_period      = number
    deletion_protection          = bool
    performance_insights_enabled = bool
    monitoring_interval          = number
    auto_minor_version_upgrade   = bool
    apply_immediately            = bool
    port                         = number
  })
}

variable "parameter_group_config" {
  description = "PostgreSQL parameter group configuration"
  type = object({
    family = string
    parameters = map(object({
      value        = string
      apply_method = string
    }))
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

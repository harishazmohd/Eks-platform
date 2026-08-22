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

variable "vpc_cidr_blocks" {
  description = "CIDR Block used by VPC"
  type        = string
}

variable "subnets" {
  description = "Map of subnets used in this project"
  type = map(object({
    cidr_block    = string
    az_index      = number
    type          = string
    map_public_ip = bool
  }))
}

variable "repositories" {
  description = "Amazon ECR Repositories"
  type = map(object({
    image_tag_mutability = string
    scan_on_push         = bool
    keep_last_images     = number
  }))
}


variable "registry_config" {
  description = "Amazon ECR registry configuration"
  type = object({
    scan_type              = string
    scan_frequency         = string
    repository_filter      = string
    repository_filter_type = string
  })

}

variable "db_port" {
  description = "Database port"
  type        = number
}

variable "keys" {
  description = "KMS keys configuration"
  type = map(object({
    description              = string
    deletion_window_in_days  = number
    key_usage                = string
    enable_key_rotation      = bool
    multi_region             = bool
    customer_master_key_spec = string
  }))
}

variable "parameter_group_config" {
  description = "RDS parameter group configuration"
  type = object({
    family = string
    parameters = map(object({
      value        = string
      apply_method = string
    }))
  })
}

variable "alb_controller" {
  description = ""
  type = object({
    name          = optional(string, "aws-alb-controller")
    chart_version = optional(string, "")
    enabled       = optional(bool, true)
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

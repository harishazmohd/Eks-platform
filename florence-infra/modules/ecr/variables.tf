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

variable "repositories" {
  description = "Amazon ECR Repositories"
  type        = map(object({
    image_tag_mutability = string
    scan_on_push         = bool
    keep_last_images = number
  }))
}

variable "encryption_configuration" {
  description = "Repository encrption configuration"
  type = object({
    encryption_type = string
    kms_key = optional(string)
  })
}

variable "registry_config" {
  description = "Amazon ECR registry configuration"
  type = object({
    scan_type = string
    scan_frequency = string
    repository_filter = string
    repository_filter_type = string
  })

}


variable "common_tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
  default     = {}
}
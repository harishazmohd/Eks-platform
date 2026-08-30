variable "project_name" {
  description = "Name of the project goes here"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
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

variable "addons_config" {
  description = "EKS Addon configuration"
  type = map(object({
    addon_name                  = string
    addon_version               = string
    resolve_conflicts_on_create = string
    resolve_conflicts_on_update = string
  }))
}

variable "alb_controller" {
  description = ""
  type = object({
    name          = optional(string, "aws-alb-controller")
    chart_version = optional(string, "")
    enabled       = optional(bool, true)
  })

}

variable "rds_kms_key_arn" {
  type = string
}

variable "metadata" {
  description = "Metadata for the AWS resources"
  type = object({
    owner      = string
    repository = string
  })
}

variable "secrets_manager_arn" {
  description = "Secrets Manager ARN"
  type        = string
}


variable "github_user" {
  type    = string
  default = "harishazmohd"
}

variable "github_repo" {
  type    = string
  default = "Eks-platform"
}

variable "frontend_ecr_arn" {
  type = string
}

variable "backend_ecr_arn" {
  type = string
}


variable "common_tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
  default     = {}
}

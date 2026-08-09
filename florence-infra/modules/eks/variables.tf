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

variable "private_subnet_ids" {
  description = "AWS Subnet ids"
  type        = list(string)
}

variable "cluster_name" {
  description = "Name of the cluster"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes Cluster Version"
  type        = string
}

variable "cluster_endpoint_config" {
  description = "EKS Cluster Endpoint Config"
  type = object({
    endpoint_private_access = bool
    endpoint_public_access  = bool
  })
}

variable "enable_cluster_logging_types" {
  description = "EKS Cluster Logging"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS Key ARN"
  type        = string
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

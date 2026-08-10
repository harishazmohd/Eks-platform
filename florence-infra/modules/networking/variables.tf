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

variable "vpc_cidr" {
  description = "Main CIDR Block for the VPC"
  type        = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block."
  }
}

variable "instance_tenancy" {
  description = "Instance tenancy for the VPC"
  type        = string
  default     = "default"
  validation {
    condition = contains(
      ["default", "dedicated"],
      var.instance_tenancy
    )

    error_message = "instance_tenancy must be 'default' or 'dedicated'."
  }
}

variable "dns_support" {
  description = "Enable DNS resolution"
  type        = bool
  default     = true
}

variable "dns_hostnames" {
  description = "Enable DNS Hostnames"
  type        = bool
  default     = true
}

variable "availability_zones" {
  description = "Availability zones used by the networking module"
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "At least two AZs are required"
  }
}

variable "nat_gateway" {
  description = "NAT Gateway configuration"

  type = object({
    enabled    = bool
    single_nat = bool
  })

  default = {
    enabled    = true
    single_nat = true
  }
}

variable "assign_generated_ipv6_cidr_block" {
  description = "Assign an AWS-generated IPv6 CIDR block."
  type        = bool
  default     = false
}

variable "subnets" {
  description = "Subnets used in the networking module"
  type = map(object({
    cidr_block    = string
    az_index      = number
    type          = string
    map_public_ip = bool
  }))
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

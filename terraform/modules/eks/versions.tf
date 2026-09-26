// Provider compatibility for EKS, Helm, Kubernetes, and kubectl resources.
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.7.0"
    }
  }
}

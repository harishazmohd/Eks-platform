// Shared identity and trust-policy data used by EKS and its controllers.
data "aws_availability_zones" "current" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# Cluster role policy
data "aws_iam_policy_document" "eks_cluster_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

#  Node role policy
data "aws_iam_policy_document" "node_group_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# OIDC enables short-lived credentials for workloads and GitHub Actions.

data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

data "tls_certificate" "github_provider" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "irsa_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.this.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:aud"
      values   = ["sts:amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:sub"
      values   = ["system:serviceaccount:application:backend"]
    }
  }
}

# The ALB controller may assume its role only from its service account.
data "aws_iam_policy_document" "alb_assume_role" {
  count = var.alb_controller.enabled ? 1 : 0
  statement {
    sid     = "AllowServiceAccountAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.this.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:sub"
      values   = ["system:serviceaccount:kube-system:${var.alb_controller.name}"]
    }
  }
}


# ALB Controller Policies
data "aws_iam_policy_document" "alb_controller_permissions" {
  count                   = var.alb_controller.enabled ? 1 : 0
  source_policy_documents = [file("${path.module}/policy/alb_policy.json")]
}

# External Secrets receives only the secret and KMS access it needs.
data "aws_iam_policy_document" "external_secrets_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.this.arn]
    }
    actions = ["sts:AssumeRoleWithWebIdentity"]
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:sub"
      values   = ["system:serviceaccount:external-secrets:external-secrets"]
    }
  }
}


# Karpenter uses a separate service-account trust policy for node provisioning.
data "aws_iam_policy_document" "karpenter_policy_document" {
    statement {
      sid = "KarpenterControllerAssumeRole"
      effect = "Allow"
      actions = ["sts:AssumeRoleWithWebIdentity"]
      principals {
        type = "Federated"
        identifiers = [aws_iam_openid_connect_provider.this.arn]
      }

      condition {
        test = "StringEquals"
        variable = "${local.oidc_host}:aud"
        values = ["sts.amazonaws.com"]
      }
      condition {
        test = "StringEquals"
        variable = "${local.oidc_host}:sub"
        values = ["system:serviceaccount:karpenter:karpenter"]
      }
    }
}

# Karpenter Node role policy allows Karpenter to provision EC2 nodes in the cluster.
data "aws_iam_policy_document" "karpenter_node_role" {
  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type = "Service"

      identifiers = [
        "ec2.amazonaws.com"
      ]
    }
  }
}
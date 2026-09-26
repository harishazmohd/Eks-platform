// Generate cluster and managed-node roles from one local configuration map.
resource "aws_iam_role" "this" {
  for_each           = local.role_config
  name               = each.value.name
  assume_role_policy = each.value.role_policy
  tags = merge(local.common_tags, {
    Name = each.value.name
  })
}


resource "aws_iam_role_policy_attachment" "eks_cluster" {
  for_each   = local.iam_role_attachment
  role       = aws_iam_role.this[each.value.role_key].name
  policy_arn = each.value.policy_arn
}


// Dedicated IRSA role for the AWS Load Balancer Controller.
resource "aws_iam_role" "alb_role" {
  count              = var.alb_controller.enabled ? 1 : 0
  name               = "${local.name_prefix}-alb-controller"
  assume_role_policy = data.aws_iam_policy_document.alb_assume_role[0].json
  description        = "IAM role for the ALB controller"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-controller"
  })
}


resource "aws_iam_role_policy" "alb_controller" {
  count  = var.alb_controller.enabled ? 1 : 0
  name   = "${var.alb_controller.name}-policy"
  role   = aws_iam_role.alb_role[0].name
  policy = (data.aws_iam_policy_document.alb_controller_permissions[0].json)
}


# External Secrets reads the RDS secret and decrypts it with the RDS key.
resource "aws_iam_role" "external_secrets" {
  name               = "${local.name_prefix}-external-secrets"
  assume_role_policy = data.aws_iam_policy_document.external_secrets_assume_role.json
  description        = "IAM role for External Secrets"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-external-secrets"
  })
}

resource "aws_iam_role_policy" "external_secrets" {
  role = aws_iam_role.external_secrets.name
  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "kms:Decrypt"
        ]

        Resource = [var.secrets_manager_arn, var.rds_kms_key_arn]
      }
    ]
  })
}


// GitHub Actions publishes images through short-lived OIDC credentials.
resource "aws_iam_role" "github_oidc_role" {
  name = "${local.name_prefix}-oidc-github"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringEquals = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_user}@197080976/${var.github_repo}@1349937433:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}


resource "aws_iam_policy" "github_actions_ecr" {
  name = "${local.name_prefix}-github-actions-ecr"
  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "ecr:GetAuthorizationToken"
        ]

        Resource = "*"
      },


      {
        Effect = "Allow"

        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]

        Resource = [
          var.frontend_ecr_arn,
          var.backend_ecr_arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_policy_attachment" {
  role       = aws_iam_role.github_oidc_role.name
  policy_arn = aws_iam_policy.github_actions_ecr.arn
}



# Karpenter controller permissions are separate from the EC2 node role.
resource "aws_iam_role" "karpenter" {
  name               = local.names.karpenter_controller
  assume_role_policy = data.aws_iam_policy_document.karpenter_policy_document.json
  tags = merge(local.common_tags, {
    Name = local.names.karpenter_controller
  })
}

# Karpenter IAM policy
resource "aws_iam_role_policy" "karpenter_policy" {
  name = "${local.names.karpenter_controller}-policy"
  role = aws_iam_role.karpenter.id
  policy = templatefile("${path.module}/policy/karpenter.json", {
    partition               = data.aws_partition.current.partition
    region                  = var.aws_region
    cluster_name            = var.cluster_config.cluster_name
    cluster_arn             = aws_eks_cluster.this.arn
    karpenter_node_role_arn = aws_iam_role.karpenter_node.arn
  })
}


# Karpenter-launched nodes receive baseline EKS and SSM permissions.
resource "aws_iam_role" "karpenter_node" {
  name               = local.names.karpenter_node_role
  assume_role_policy = data.aws_iam_policy_document.karpenter_node_role.json

  tags = merge(
    local.common_tags,
    {
      Name = local.names.karpenter_node_role
    }
  )
}

resource "aws_iam_role_policy_attachment" "karpenter_node" {
  for_each = toset([
    "AmazonEKSWorkerNodePolicy",
    "AmazonEC2ContainerRegistryPullOnly",
    "AmazonEKS_CNI_Policy",
    "AmazonSSMManagedInstanceCore"
  ])

  role       = aws_iam_role.karpenter_node.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/${each.value}"
}

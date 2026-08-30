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


# IAM role for External Secrets
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

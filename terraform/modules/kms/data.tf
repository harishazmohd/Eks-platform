data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_iam_policy_document" "kms" {
  for_each = var.keys
  statement {

    sid    = "EnableRootPermissions"
    effect = "Allow"
    principals {
      type = "AWS"
      identifiers = [
        "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
      ]
    }
    actions = [
      "kms:*"
    ]
    resources = ["*"]

  }

  statement {

    sid = "AllowIAMPermissions"

    effect = "Allow"

    principals {

      type = "AWS"

      identifiers = [

        "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"

      ]

    }

    actions = [

      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:TagResource",
      "kms:UntagResource",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion"

    ]

    resources = ["*"]

  }
}

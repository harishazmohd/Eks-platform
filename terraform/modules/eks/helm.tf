# Controllers are installed after initial worker capacity exists.
# ALB Controller
resource "helm_release" "aws_load_balancer_controller" {
  name       = local.name_prefix
  namespace  = "kube-system"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"

  version = var.alb_controller.chart_version
  values = [templatefile("${path.module}/helm/aws-load-balancer-controller-values.yaml.tfpl", {
    cluster_name         = aws_eks_cluster.this.name
    region               = var.aws_region
    vpc_id               = var.vpc_id
    service_account_name = "aws-load-balancer-controller"
    aws_iam_role_arn     = aws_iam_role.alb_role[0].arn
  })]
  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this]
}

# Synchronize AWS Secrets Manager values into Kubernetes Secrets.
resource "helm_release" "external_secrets" {
  name             = "external-secrets"
  namespace        = "external-secrets"
  create_namespace = true
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  version          = "2.9.0"

  wait    = true
  timeout = 600

  values = [yamlencode({
    installCRDs = true
    serviceAccount = {
      create = true
      name   = "external-secrets"
      annotations = {
        "eks.amazonaws.com/role-arn" = aws_iam_role.external_secrets.arn
      }

    }

  })]

  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this, helm_release.aws_load_balancer_controller]
}

# Reconcile the application manifests stored in Git.
resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"

  wait    = true
  timeout = 600


  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this, helm_release.external_secrets]
}

# Karpenter CRDs must be installed before the Karpenter controller.
resource "helm_release" "karpenter_crd" {
  name             = "karpenter-crd"
  namespace        = "karpenter"
  create_namespace = true

  repository = "oci://public.ecr.aws/karpenter"
  chart      = "karpenter-crd"
  version    = var.karpenter_version

  wait    = true
  timeout = 600

  depends_on = [
    aws_eks_cluster.this,
    aws_eks_node_group.this,
  ]
}

# Karpenter adds node capacity for workloads that cannot fit on managed nodes.
resource "helm_release" "karpenter" {
  name      = "karpenter"
  namespace = "karpenter"

  repository = "oci://public.ecr.aws/karpenter"
  chart      = "karpenter"
  version    = var.karpenter_version

  wait    = true
  timeout = 600

  values = [templatefile("${path.module}/helm/karpenter.yaml.tfpl", {
    serviceAccountName = "karpenter"
    roleArn            = aws_iam_role.karpenter.arn
    clusterName        = aws_eks_cluster.this.name
    clusterEndpoint    = aws_eks_cluster.this.endpoint
    workload           = "general"
  })]
  depends_on = [
    aws_eks_cluster.this,
    aws_eks_node_group.this,
    helm_release.argocd,
    aws_iam_role.karpenter,
    helm_release.karpenter_crd,
  ]
}

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

# External Secrets
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

  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this]
}

# ArgoCD
resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"

  wait    = true
  timeout = 600

  values = templatefile("${path.module}/helm/argocd-values.yaml.tfpl", {
    name            = "bankapp-dev"
    argocdNamespace = "argocd"
    repoURL         = "https://github.com/muhdhares/Eks-platform.git"
    targetRevision  = "main"
    path            = "bank-app"
    valueFiles      = ["${path.module}/helm/argocd-values.yaml.tfpl"]
    server          = "https://kubernetes.default.svc"
    namespace       = "bankapp"
  })

  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this, helm_release.external_secrets]
}

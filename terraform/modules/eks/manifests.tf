resource "kubectl_manifest" "backend_security_group_policy" {
  yaml_body = yamlencode({
    apiVersion = "vpcresources.k8s.aws/v1beta1"
    kind       = "SecurityGroupPolicy"
    metadata = {
      name      = "backend-pods"
      namespace = var.application_namespace
    }
    spec = {
      podSelector = {
        matchLabels = {
          "app.kubernetes.io/component" = "backend"
        }
      }
      securityGroups = {
        groupIds = [aws_security_group.backend_pods.id]
      }
    }
  })

  depends_on = [
    aws_eks_addon.this["vpc_cni"],
    aws_eks_node_group.this,
    kubernetes_namespace_v1.bankapp,
  ]
}

// Restrict ArgoCD's repository and destination before creating the application.
resource "kubectl_manifest" "appproject" {
  yaml_body = templatefile("${path.module}/helm/appproject.yaml.tfpl", {
    name        = "eks-platform-dev"
    source_repo = "https://github.com/harishazmohd/Eks-platform.git"
    namespace   = "bankapp"
  })
  depends_on = [helm_release.argocd]
}
// ArgoCD watches the declared Git revision and reconciles the Helm chart.
resource "kubectl_manifest" "argocd" {
  yaml_body = templatefile("${path.module}/helm/argocd.yaml.tfpl", {
    name            = "argo-cd"
    argocdNamespace = "argocd"
    repoURL         = "https://github.com/harishazmohd/Eks-platform.git"
    targetRevision  = "main"
    path            = "helm/bankapp"
    valueFiles      = "values.yaml"
    server          = "https://kubernetes.default.svc"
    namespace       = "bankapp"
    projectName     = "eks-platform-dev"
  })
  depends_on = [
    helm_release.argocd,
    kubectl_manifest.appproject,
    kubectl_manifest.backend_security_group_policy,
    time_sleep.wait_for_argocd_cleanup
  ]
}

resource "time_sleep" "wait_for_argocd_cleanup" {
  depends_on = [
    helm_release.aws_load_balancer_controller,
    helm_release.external_secrets,
    helm_release.karpenter,
  ]
  destroy_duration = "90s"
}


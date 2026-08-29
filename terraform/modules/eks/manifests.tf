resource "kubectl_manifest" "appproject" {
  yaml_body = templatefile("${path.module}/helm/appproject.yaml.tfpl", {
    name        = "eks-platform-dev"
    source_repo = "https://github.com/harishazmohd/Eks-platform.git"
    namespace   = "bankapp"
  })
  depends_on = [helm_release.argocd]
}
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
  })
  depends_on = [
    helm_release.argocd,
    kubectl_manifest.appproject,
    time_sleep.wait_for_argocd_cleanup
  ]
}

resource "time_sleep" "wait_for_argocd_cleanup" {
  depends_on = [
    helm_release.aws_load_balancer_controller,
    helm_release.external_secrets
  ]
  destroy_duration = "90s"
}


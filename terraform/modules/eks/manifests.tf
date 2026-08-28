resource "kubectl_manifest" "appproject" {
  yaml_body = templatefile("${path.module}/helm/appproject.yaml.tfpl", {
    name        = "eks-platform-dev"
    source_repo = "https://github.com/muhdhares/Eks-platform.git"
    namespace   = "bankapp"
  })
}
resource "kubectl_manifest" "argocd" {
  yaml_body = templatefile("${path.module}/helm/argocd.yaml.tfpl", {
    name            = "argo-cd"
    argocdNamespace = "argocd"
    repoURL         = "https://github.com/muhdhares/Eks-platform.git"
    targetRevision  = "main"
    path            = "helm/bankapp"
    valueFiles      = "values.yaml"
    server          = "https://kubernetes.default.svc"
    namespace       = "bankapp"
  })
  depends_on = [helm_release.argocd, kubectl_manifest.appproject]
}

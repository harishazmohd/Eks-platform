resource "kubernetes_namespace_v1" "bankapp" {
  metadata {
    name = "bankapp"
  }
  depends_on = [ aws_eks_node_group.this ]
}

resource "kubectl_manifest" "argocd" {
  yaml_body = templatefile("${path.module}/helm/argocd.yaml.tfpl", {
    name            = "argo-cd"
    argocdNamespace  = "argocd"
    repoURL         = "https://github.com/muhdhares/Eks-platform.git"
    targetRevision  = "main"
    path            = "helm/argocd"
    valueFiles      = "values.yaml"
    server          = "https://kubernetes.default.svc"
    namespace       = "bankapp"
  } )
  depends_on = [ helm_release.argocd ]
}

resource "kubectl_manifest" "store" {
  yaml_body  = file("${path.module}/manifests/store.yaml")
  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this, helm_release.external_secrets]
}

resource "kubectl_manifest" "argocd" {
  yaml_body = templatefile("${path.module}/helm/argocd.yaml.tfpl", {
    name            = "bankapp-dev"
    argocdNamespace = "argocd"
    repoURL         = "https://github.com/muhdhares/Eks-platform.git"
    targetRevision  = "main"
    path            = "helm/bankapp"
    valueFiles      = "values.yaml"
    server          = "https://kubernetes.default.svc"
    namespace       = "bankapp"
  })
  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this, helm_release.argocd]
}

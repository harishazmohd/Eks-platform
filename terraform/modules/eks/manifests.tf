resource "kubectl_manifest" "store" {
  yaml_body  = file("${path.module}/manifests/store.yaml")
  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this, helm_release.external_secrets]
}

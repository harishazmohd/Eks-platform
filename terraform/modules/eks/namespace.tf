// Create the application namespace before ArgoCD or Helm deploys workloads.
resource "kubernetes_namespace_v1" "bankapp" {
  metadata {
    name = "bankapp"
  }
  depends_on = [aws_eks_cluster.this, aws_eks_node_group.this]
}

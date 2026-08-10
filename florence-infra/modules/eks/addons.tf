resource "aws_eks_addon" "this" {
  for_each                    = var.addons_config
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = each.value.addon_name
  addon_version               = each.value.addon_version
  resolve_conflicts_on_create = each.value.resolve_conflicts_on_create
  resolve_conflicts_on_update = each.value.resolve_conflicts_on_update

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${each.value.addon_name}"
  })
}

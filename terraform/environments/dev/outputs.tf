// Expose identifiers needed by operators and downstream environment tooling.
output "security_groupids" {
  value = module.eks.node_group_sg
}

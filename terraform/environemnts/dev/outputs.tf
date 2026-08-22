output "security_groupids" {
  value = module.eks.node_group_sg
}

output "rds_master_arn" {
  value = module.rds.rds.instance.db_master_secret_arn
}

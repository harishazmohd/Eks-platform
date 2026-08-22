# State Migration: Moved foundational Security Groups from module.security to module.vpc

moved {
  from = module.security.aws_security_group.alb
  to   = module.vpc.aws_security_group.alb
}

moved {
  from = module.security.aws_security_group.database
  to   = module.vpc.aws_security_group.database
}

moved {
  from = module.security.aws_security_group.bastion
  to   = module.vpc.aws_security_group.bastion
}

moved {
  from = module.security.aws_security_group.vpc_endpoint
  to   = module.vpc.aws_security_group.vpc_endpoint
}

# ADR-0004: Amazon RDS Module Architecture

- **Status:** Accepted
- **Date:** 2026-08-06
- **Authors:** Project Florence
- **Decision Type:** Architecture
- **Related Modules:** Networking, AWS KMS, Amazon EKS, External Secrets

---

# Context

Project Florence requires a production-grade relational database platform for stateful application workloads.

The backend service running on Amazon EKS requires:

- Durable PostgreSQL storage
- Encryption at rest
- Private network connectivity
- Automated backups
- Enhanced monitoring
- Secure credential management

The database platform must integrate with the existing Florence architecture while preserving module ownership boundaries.

---

# Problem Statement

How should the relational database platform be implemented without violating Florence's architectural principles?

The solution must:

- avoid duplicated networking resources
- avoid duplicated encryption resources
- expose a stable module interface
- support future Kubernetes integration
- support future GitOps workflows
- remain production-ready

---

# Decision

Implement Amazon RDS PostgreSQL as a dedicated Terraform module.

The RDS module owns only database-specific resources and consumes shared platform services from previously implemented modules.

---

# Resource Ownership

The module owns:

- DB Subnet Group
- DB Parameter Group
- Enhanced Monitoring IAM Role
- PostgreSQL Database Instance

The module explicitly does **not** own:

- VPC
- Subnets
- Route Tables
- Security Groups
- KMS Keys
- Container Registry

These resources are consumed from existing Florence modules.

---

# Dependencies

The dependency graph is:

Networking
→ Database Subnets
→ Database Security Group

AWS KMS
→ Platform Encryption Key

↓

Amazon RDS

The module does not depend on Amazon EKS.

Amazon EKS will later depend on Amazon RDS.

---

# Database Engine

Selected engine:

- PostgreSQL

Reasoning:

- Open source
- Mature ecosystem
- Strong AWS support
- Native compatibility with modern frameworks
- Excellent Terraform support

---

# Network Architecture

The database is deployed into private database subnets.

Public accessibility is disabled.

Only workloads inside the VPC may communicate with the database.

Ingress is controlled exclusively through the Database Security Group owned by the Networking module.

---

# Encryption Strategy

Storage encryption is enabled.

The database uses the platform Customer Managed KMS Key.

No service-specific KMS keys are created.

Benefits:

- centralized key management
- simplified auditing
- consistent encryption policy
- reduced operational complexity

---

# Authentication Strategy

AWS-managed master credentials are enabled.

Terraform does not manage plaintext passwords.

Configuration:

- manage_master_user_password = true

AWS automatically:

- generates credentials
- stores credentials in Secrets Manager
- encrypts the secret using the platform KMS key

Future phases will synchronize these credentials into Kubernetes using External Secrets Operator.

---

# Monitoring Strategy

Enhanced Monitoring is enabled.

A dedicated IAM role is created for Amazon RDS.

CloudWatch receives operating system metrics from the managed database service.

Future monitoring phases will integrate these metrics into Grafana dashboards.

---

# Parameter Management

A dedicated PostgreSQL Parameter Group is created.

AWS default parameter groups are not modified.

Parameter values are version-controlled through Terraform.

Benefits:

- reproducibility
- auditability
- environment-specific tuning
- simplified upgrades

---

# High Availability

Development environment:

- Single-AZ

Production recommendation:

- Multi-AZ enabled

The module interface supports both configurations.

---

# Storage Strategy

Selected storage:

- gp3

Benefits:

- lower cost
- predictable performance
- automatic storage scaling support

Provisioned IOPS remain optional and are enabled only for workloads that require them.

---

# Module Interface

Inputs:

- project_name
- environment
- aws_region
- database_subnet_ids
- db_security_group_id
- kms_key_id
- database_config
- parameter_group
- metadata
- common_tags

Outputs:

- instance
- subnet_group
- parameter_group
- monitoring_role

The module exposes a single structured output.

---

# Alternatives Considered

## Create Security Groups inside the RDS module

Rejected.

Reason:

Networking owns all networking resources.

Creating security groups in the RDS module would violate Florence's ownership model.

---

## Create a dedicated KMS key for RDS

Rejected.

Reason:

Florence uses a centralized encryption platform.

One shared platform key reduces operational complexity while satisfying the project's security requirements.

---

## Store database passwords in Terraform

Rejected.

Reason:

Terraform state should not contain user-supplied database passwords.

AWS-managed credentials provide a stronger operational model.

---

## Use the default PostgreSQL Parameter Group

Rejected.

Reason:

Default parameter groups are shared AWS-managed resources.

Terraform-managed parameter groups provide version control and reproducibility.

---

## Create an Option Group

Rejected.

Reason:

Amazon RDS PostgreSQL does not require an Option Group for this architecture.

The resource would add complexity without delivering value.

---

# Consequences

Positive:

- clear module ownership
- reusable architecture
- centralized encryption
- secure credential management
- clean dependency graph
- production-ready design

Negative:

- additional dependency on AWS Secrets Manager
- more initial Terraform resources
- greater architectural planning compared to a minimal implementation

---

# Future Work

Future phases will integrate:

- Amazon EKS
- External Secrets Operator
- ArgoCD
- Prometheus
- Grafana
- Disaster Recovery

No architectural changes to the RDS module are expected for these integrations.

---

# Status

Accepted.

This ADR establishes the long-term architecture for the Amazon RDS module in Project Florence.
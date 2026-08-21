# Production-Grade AWS Cloud Platform

> **Project EKS-Platform** — An AI-assisted, production-oriented AWS cloud platform built with **Terraform, Amazon EKS, Kubernetes, Amazon ECR, AWS KMS, Amazon RDS, and modern DevOps practices**.

![AWS](https://img.shields.io/badge/AWS-Cloud-orange)
![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestration-326CE5)
![Amazon EKS](https://img.shields.io/badge/Amazon-EKS-FF9900)
![Amazon ECR](https://img.shields.io/badge/Amazon-ECR-FF9900)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

---

## 📌 Overview

**Project EKS-Platform** is a production-grade AWS cloud platform designed to demonstrate how a modern application environment can be **architected, provisioned, secured, deployed, and operated using Infrastructure as Code and Kubernetes**.

The platform is being built incrementally through independent infrastructure phases, with clear ownership boundaries between networking, security, container infrastructure, databases, and Kubernetes.

The application architecture is designed around three independently deployable services:

* **Frontend**
* **Backend API**
* **AI Service**

These services run on **Amazon EKS** and communicate through Kubernetes networking and service discovery, while the backend connects to **Amazon RDS PostgreSQL** for persistent application data.

The infrastructure is managed entirely through **Terraform modules**, allowing the platform to remain reproducible, version-controlled, and environment-aware.

---

# 🎯 Project Goals

EKS-Platform is designed to demonstrate practical knowledge of:

* AWS cloud architecture
* Infrastructure as Code
* Terraform module design
* Kubernetes
* Amazon EKS
* Containerization
* CI/CD
* IAM and workload identity
* Network security
* Encryption
* Database infrastructure
* Observability
* GitOps
* Disaster recovery
* Production-oriented DevOps practices

The goal is not simply to provision AWS resources, but to demonstrate how these components work together as a **complete cloud platform**.

---

# 🏗️ High-Level Architecture

```text
                                  INTERNET
                                      │
                                      ▼
                           AWS Load Balancer Layer
                                      │
                                      ▼
                              Amazon EKS Cluster
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 ▼                    ▼                    ▼
          Frontend Service     Backend Service       AI Service
                 │                    │                    │
                 ▼                    ▼                    │
          Frontend Pods          Backend Pods ◄───────────┘
                                      │
                                      ▼
                              Amazon RDS PostgreSQL
                                      │
                              Private DB Subnets


        ┌────────────────────────────────────────────────────┐
        │                 AWS Platform Layer                │
        │                                                    │
        │  Networking │ ECR │ KMS │ IAM │ EKS │ RDS         │
        └────────────────────────────────────────────────────┘
```

---

# 🧩 Core AWS Components

The platform is being developed across **5+ infrastructure phases** with **10+ AWS services and platform components**.

| Component             | Purpose                            |
| --------------------- | ---------------------------------- |
| Amazon VPC            | Core network infrastructure        |
| Public Subnets        | Internet-facing infrastructure     |
| Private Subnets       | Application and database workloads |
| Security Groups       | Network-level access control       |
| Amazon ECR            | Container image registry           |
| AWS KMS               | Centralized encryption             |
| Amazon RDS PostgreSQL | Persistent relational database     |
| Amazon EKS            | Managed Kubernetes platform        |
| IAM                   | Identity and access management     |
| CloudWatch            | AWS monitoring and logging         |
| Kubernetes            | Application orchestration          |
| EKS Add-ons           | Core Kubernetes/AWS integrations   |

Additional components will be introduced as the platform evolves.

---

# 🏛️ Infrastructure Architecture

EKS-Platform follows a modular Terraform architecture.

```text
Terraform Root
│
├── Networking Module
│   ├── VPC
│   ├── Subnets
│   ├── Route Tables
│   ├── Internet Gateway
│   ├── NAT Gateway
│   └── Security Groups
│
├── ECR Module
│   └── Container Repositories
│
├── KMS Module
│   └── Customer Managed KMS Key
│
├── RDS Module
│   ├── DB Subnet Group
│   ├── Parameter Group
│   ├── Monitoring Role
│   └── PostgreSQL Instance
│
└── EKS Module
    ├── EKS Cluster
    ├── IAM Roles
    ├── Managed Node Groups
    ├── EKS Add-ons
    └── Access Entries
```

Each module has a clearly defined responsibility.

---

# 🧱 Infrastructure Module Philosophy

A core architectural principle of EKS-Platform is:

> **A module should own the resources belonging to its domain and consume shared infrastructure from other modules.**

For example:

### Networking owns

```text
VPC
Subnets
Route Tables
Security Groups
```

### KMS owns

```text
Customer Managed KMS Key
```

### RDS owns

```text
DB Instance
DB Subnet Group
Parameter Group
Monitoring IAM Role
```

### EKS owns

```text
EKS Cluster
Cluster IAM Role
Node IAM Role
Managed Node Groups
EKS Add-ons
Access Entries
```

RDS therefore **does not create its own VPC or database security group**.

It consumes those resources from Networking.

Similarly, EKS consumes networking and encryption resources rather than recreating them.

This prevents duplicated infrastructure and keeps module boundaries predictable.

---

# 🌐 Networking Architecture

The platform follows a private-by-default architecture.

```text
                     VPC
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   Public Subnets             Private Subnets
        │                           │
        │                    ┌──────┴──────┐
        │                    │             │
        ▼                    ▼             ▼
 Load Balancers          EKS Nodes       RDS
```

Public-facing infrastructure is isolated from stateful workloads.

The database is deployed into private database subnets and is not directly accessible from the public Internet.

---

# 🔐 Security Architecture

Security is implemented at multiple layers.

## Network Security

Security Groups control traffic between:

```text
Internet
   ↓
Load Balancer
   ↓
EKS
   ↓
RDS
```

The database accepts traffic only from authorized application workloads.

---

## IAM

IAM is used to control:

* EKS control-plane permissions
* Worker-node permissions
* ECR image pulls
* AWS API access
* Kubernetes workload permissions

The project follows the principle of:

> **Least privilege**

---

# 🔑 Centralized KMS Architecture

EKS-Platform uses a centralized Customer Managed KMS key rather than creating an independent key for every module.

```text
                  AWS KMS
                     │
          Customer Managed Key
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
       RDS          EKS       Other Services
```

This provides:

* Centralized encryption management
* Consistent security policy
* Easier auditing
* Reduced key-management complexity
* Reusable encryption infrastructure

---

# 🗄️ Amazon RDS PostgreSQL

RDS provides persistent relational storage for the backend application.

```text
Backend Pods
     │
     │ PostgreSQL
     ▼
RDS PostgreSQL
     │
     ▼
Private Database Subnets
```

The RDS module includes:

* PostgreSQL
* DB Subnet Group
* Parameter Group
* Encryption
* Automated backup configuration
* Enhanced Monitoring
* IAM monitoring role
* Storage configuration
* Multi-AZ capability
* Deletion protection capability

Database credentials are managed through AWS-managed master credentials rather than hardcoding passwords into Terraform configuration.

---

# 📦 Amazon ECR

Amazon ECR acts as the private container registry.

```text
Developer
    │
    ▼
Docker Build
    │
    ▼
Amazon ECR
    │
    ▼
Amazon EKS
    │
    ▼
Kubernetes Pods
```

Application images include:

```text
Frontend Image
Backend Image
AI Service Image
```

The EKS worker nodes receive the necessary permissions to pull private images from ECR.

---

# ☸️ Amazon EKS

Amazon EKS provides the managed Kubernetes platform.

The architecture separates:

```text
AWS-managed Control Plane
            │
            ▼
      Worker Nodes
            │
            ▼
          Pods
```

The EKS cluster is responsible for running the application workloads.

---

# Kubernetes Application Architecture

EKS-Platform is designed around independent services.

```text
                    EKS
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
     Frontend     Backend         AI
      Service      Service      Service
        │            │            │
        ▼            ▼            │
     Frontend     Backend         │
       Pods         Pods ◄─────────┘
                     │
                     ▼
                  RDS
```

Each service can be deployed and scaled independently.

---

# 🔄 Service-to-Service Communication

Kubernetes Services provide stable endpoints for application communication.

Instead of communicating directly with Pod IP addresses:

```text
Frontend → Pod IP
```

the application communicates through Kubernetes Services:

```text
Frontend
   │
   ▼
Backend Service
   │
   ▼
Backend Pods
```

This is important because Pod IP addresses are ephemeral.

If a Pod is recreated, its IP can change.

The Service provides a stable abstraction.

---

# 🤖 AI Service

EKS-Platform includes a dedicated AI service as an independent application workload.

```text
Frontend
    │
    ▼
Backend API
    │
    ├──────────────► RDS
    │
    └──────────────► AI Service
```

The AI service is intentionally separated from the backend so it can be:

* Independently deployed
* Independently scaled
* Independently monitored
* Independently secured
* Updated without redeploying the entire application

This also provides a foundation for future AI/ML infrastructure.

---

# 🧠 AI-Assisted Engineering

AI plays a second role in the project beyond the application AI service.

EKS-Platform is developed using an **AI-assisted engineering workflow**.

AI is used as an engineering copilot for:

* AWS architecture design
* Terraform module development
* Terraform troubleshooting
* Kubernetes manifest development
* Kubernetes debugging
* IAM policy analysis
* Security reviews
* Architecture reviews
* Documentation
* Architecture Decision Records
* DevOps runbooks
* Production-readiness analysis

The architecture, infrastructure boundaries, implementation decisions, and validation remain part of the engineering process.

The objective is to demonstrate how AI can be incorporated into a professional cloud engineering workflow rather than simply using AI to generate code.

---

# 🔌 Application Ports

Port ownership is documented explicitly to avoid confusion between:

* Container ports
* Kubernetes Service ports
* Load Balancer ports
* Security Group ports

The expected application architecture uses:

| Component   |                Port | Protocol | Purpose              |
| ----------- | ------------------: | -------- | -------------------- |
| Frontend    |                  80 | HTTP     | Frontend application |
| Backend API |                3000 | HTTP     | Backend API          |
| PostgreSQL  |                5432 | TCP      | Database             |
| AI Service  | Application-defined | HTTP     | AI API               |

The exact AI service port is determined by the application implementation.

---

# 🔒 Security Group Exposure

The general traffic model is:

```text
Internet
   │
   ▼
Load Balancer
   │
   ▼
Frontend / API
   │
   ▼
Backend
   │
   ├────────► AI Service
   │
   └────────► PostgreSQL
```

The database port:

```text
5432
```

is **not exposed publicly**.

Only authorized application traffic should reach PostgreSQL.

Security Groups therefore follow the principle:

> **Expose only the ports required by the architecture.**

---

# 🔐 EKS Identity

The project uses AWS-native identity mechanisms for EKS.

The architecture distinguishes between:

### Human/Administrator Access

Managed through:

```text
EKS Access Entries
```

### Kubernetes Workload Access

The platform is designed to use:

```text
EKS Pod Identity
```

for modern workload-to-AWS authentication.

IRSA/OIDC is also studied as part of the EKS learning track because understanding both mechanisms is important for production Kubernetes engineering and compatibility with existing AWS architectures.

---

# 📊 EKS Add-ons

The EKS foundation includes AWS-managed add-ons such as:

```text
Amazon VPC CNI
CoreDNS
kube-proxy
EKS Pod Identity Agent
```

Additional components such as:

```text
AWS Load Balancer Controller
EBS CSI Driver
External Secrets Operator
ArgoCD
Prometheus
Grafana
Loki
```

are treated as platform extensions and will be introduced separately.

---

# 🔄 Deployment Flow

The intended application delivery pipeline is:

```text
Developer
    │
    ▼
Git Repository
    │
    ▼
CI Pipeline
    │
    ├── Test
    ├── Lint
    ├── Security Scan
    ├── Docker Build
    └── Push Image
            │
            ▼
         Amazon ECR
            │
            ▼
       Kubernetes / EKS
            │
            ▼
      Application Pods
```

Infrastructure follows a separate Terraform workflow:

```text
Terraform Code
      │
      ▼
terraform plan
      │
      ▼
Review
      │
      ▼
terraform apply
      │
      ▼
AWS Infrastructure
```

---

# 🏗️ Infrastructure Development Phases

EKS-Platform is being implemented incrementally.

## Phase 0 — Terraform Foundation

Establishes the Terraform project structure, providers, backend, variables, environments, and foundational conventions.

---

## Phase 1 — Networking

Creates the foundational AWS network:

* VPC
* Public subnets
* Private subnets
* Route tables
* Internet Gateway
* NAT infrastructure
* Security Groups

---

## Phase 2 — Amazon ECR

Introduces private container registries for application images.

---

## Phase 3 — AWS KMS

Creates centralized encryption infrastructure used by other platform modules.

---

## Phase 4 — Amazon RDS

Introduces the PostgreSQL database platform with:

* Private networking
* Encryption
* Parameter management
* Monitoring
* Backup configuration
* Database-specific Terraform resources

---

## Phase 5 — Amazon EKS

Introduces:

* Kubernetes
* EKS
* Managed node groups
* EKS add-ons
* IAM
* Access Entries
* Pod Identity
* Kubernetes application workloads

---

# 📚 Kubernetes Learning Track

Before completing the EKS implementation, the project includes a dedicated Kubernetes learning track.

### K1 — Kubernetes Architecture

Control plane, worker nodes, API server, scheduler, controllers, kubelet, and container runtime.

### K2 — Pods & Pod Lifecycle

Pod architecture, lifecycle phases, container states, networking, and troubleshooting.

### K3 — Deployments & ReplicaSets

Desired state, self-healing, replicas, rolling updates, and rollbacks.

### K4 — Services

ClusterIP, NodePort, LoadBalancer, service discovery, and DNS.

### K5 — ConfigMaps & Secrets

Application configuration and sensitive data management.

### K6 — Storage

Volumes, PersistentVolumes, PersistentVolumeClaims, StorageClasses, and CSI.

### K7 — Scheduling

Resource requests, limits, taints, tolerations, affinity, and scheduling behavior.

### K8 — Health & Reliability

Liveness, readiness, and startup probes.

### K9 — Kubernetes Security

RBAC, ServiceAccounts, Secrets, and workload security.

### K10 — Kubernetes Networking

CNI, kube-proxy, CoreDNS, ingress, and NetworkPolicies.

### K11 — Application Deployment

Deployment of EKS-Platform Frontend, Backend, and AI workloads.

### K12 — EKS Architecture

Mapping Kubernetes concepts to AWS EKS.

---

# 🧭 EKS Architecture Learning Track

After Kubernetes fundamentals:

```text
EKS Control Plane
        ↓
EKS Data Plane
        ↓
Managed Node Groups
        ↓
VPC CNI
        ↓
IAM
        ↓
Pod Identity / IRSA
        ↓
EKS Add-ons
        ↓
AWS Load Balancing
        ↓
Production EKS Architecture
```

This approach ensures that EKS is learned as **Kubernetes running on AWS**, rather than simply as another Terraform resource.

---

# 📁 Terraform Repository Structure

The expected infrastructure structure is:

```text
terraform/
│
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
│
├── modules/
│   ├── networking/
│   ├── ecr/
│   ├── kms/
│   ├── database/
│   └── eks/
│
└── backend/
```

The modules are intentionally separated by infrastructure responsibility.

---

# 📁 EKS Module Structure

```text
modules/eks/
│
├── README.md
├── versions.tf
├── variables.tf
├── locals.tf
├── data.tf
├── iam.tf
├── cluster.tf
├── node_groups.tf
├── addons.tf
├── access_entries.tf
└── outputs.tf
```

Each file is responsible for a specific part of the EKS platform.

---

# 📋 Architecture Decision Records

EKS-Platform uses ADRs to document significant architecture decisions.

Example:

```text
architecture/
└── adr/
    ├── ADR-0001-networking-module.md
    ├── ADR-0002-ecr-module.md
    ├── ADR-0003-kms-module.md
    └── ADR-0004-rds-module.md
```

ADRs document:

* Context
* Problem
* Decision
* Alternatives
* Consequences
* Future considerations

This prevents architectural decisions from existing only inside source code or developer memory.

---

# 🛡️ Production Engineering Principles

EKS-Platform follows several core principles.

### 1. Infrastructure as Code

Infrastructure is reproducible through Terraform.

### 2. Modular Architecture

Each infrastructure domain has clear ownership.

### 3. Least Privilege

IAM permissions are minimized wherever practical.

### 4. Private by Default

Stateful services remain inside private networking.

### 5. Centralized Encryption

KMS provides a shared encryption foundation.

### 6. Immutable Application Artifacts

Applications are packaged as container images and stored in ECR.

### 7. Declarative Infrastructure

Both Terraform and Kubernetes use declarative desired-state models.

### 8. Independent Services

Frontend, Backend, and AI workloads can evolve independently.

### 9. Documentation as Code

Architecture decisions and operational knowledge are version-controlled.

### 10. Incremental Implementation

The platform is developed in controlled phases instead of provisioning everything at once.

---

# 🚀 Current Project Status

```text
Terraform Foundation       ✅
Networking                 ✅
Amazon ECR                 ✅
AWS KMS                    ✅
Amazon RDS                 ✅
Kubernetes Learning        🚧
Amazon EKS                 🚧
Application Deployment    ⏳
CI/CD                      ⏳
Workload Identity          ⏳
Load Balancing             ⏳
External Secrets           ⏳
GitOps / ArgoCD            ⏳
Observability              ⏳
Disaster Recovery          ⏳
```

EKS-Platform is an **actively evolving project** rather than a finished static infrastructure deployment.

---

# 📈 Future Roadmap

The platform will eventually incorporate:

```text
                    Project EKS-Platform
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
   Infrastructure      Application          Operations
       │                   │                   │
       ▼                   ▼                   ▼
   Terraform             EKS                Monitoring
   AWS Networking        Kubernetes         Logging
   KMS                   Frontend            Alerting
   ECR                   Backend             DR
   RDS                   AI                  GitOps
```

Future technologies include:

* AWS Load Balancer Controller
* EBS CSI
* External Secrets Operator
* AWS Secrets Manager
* ArgoCD
* Prometheus
* Grafana
* Loki
* CloudWatch
* CI/CD automation
* Disaster recovery
* Backup and restore workflows

---

# 🎓 What This Project Demonstrates

Project EKS-Platform is designed to demonstrate practical capability across:

```text
AWS
 │
 ├── Networking
 ├── IAM
 ├── KMS
 ├── ECR
 ├── RDS
 ├── EKS
 │
 ▼
Terraform
 │
 ▼
Kubernetes
 │
 ├── Pods
 ├── Deployments
 ├── Services
 ├── Secrets
 ├── Storage
 ├── Networking
 └── Security
 │
 ▼
DevOps
 │
 ├── CI/CD
 ├── GitOps
 ├── Observability
 └── Disaster Recovery
 │
 ▼
AI-Assisted Engineering
```

The objective is to demonstrate the ability to **design and operate a complete cloud platform**, not simply use individual AWS services.

---

# 👨‍💻 Project Philosophy

> **Build it like production, understand it like an engineer, and document it like a platform team.**

EKS-Platform combines infrastructure engineering, Kubernetes, application architecture, security, automation, and AI-assisted development into a single evolving cloud platform.

---

## Status

**🚧 Active Development**

Project EKS-Platform is continuously evolving as additional infrastructure, Kubernetes capabilities, DevOps automation, observability, and disaster-recovery capabilities are implemented.

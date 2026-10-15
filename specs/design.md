# Arquitetura e Design de Software — Sistema VetCare

Este documento detalha a arquitetura de rede na AWS, a modelagem de banco de dados, a especificação das rotas da API, as políticas de firewall (Security Groups) e as Decisões de Arquitetura (ADR) para o sistema de gestão da clínica veterinária **VetCare**.

---

## 1. Diagrama de Arquitetura AWS

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                    AWS LEARNER LAB                      │
                               └─────────────────────────────────────────────────────────┘
                                                                │
 [ Usuário / Navegador Web ] ───────────────────────────────────┼────────────────────────────────┐
        │                                                       │                                │
        │ 1. Acesso ao Front-end                                │ 2. Upload da Foto (Direct S3)  │
        ▼                                                       ▼                                │
┌───────────────────────────┐                       ┌───────────────────────────┐                │
│   Amazon S3 (Bucket)      │                       │   Amazon S3 (Bucket)      │                │
│  Static Website Hosting   │                       │  Upload de Fotos Pets     │                │
└───────────────────────────>                       └───────────────────────────┘                │
        │                                                       │                                │
        │ 3. Requisições API                                    │ s3:ObjectCreated:*             │
        ▼                                                       ▼                                │
┌───────────────────────────┐                       ┌───────────────────────────┐                │
│    Amazon API Gateway     │                       │  AWS Lambda (Thumbnail)   │ ───────────────┼─────────┐
│   (Endpoint HTTPS Fixo)   │                       │   (Gera miniatura 150x150)│                │         │
└───────────────────────────┘                       └───────────────────────────┘                │         │
        │                                                       │                                │         │
        └───────────────────────────┬───────────────────────────┘                                │         │
                                    │ Execução da lógica (LabRole)                               │         │
                                    ▼                                                            │         │
┌────────────────────────────────────────────────────────────────────────────────────────────────┼──────┐  │
│                                           VPC CUSTOMIZADA                                      │      │  │
│                                                                                                │      │  │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │      │  │
│   │                                SUBNET PRIVADA 1 e 2                                    │   │      │  │
│   │                                                                                        │   │      │  │
│   │   ┌──────────────────────────────────┐        VPC Gateway Endpoint      ┌──────────┐   │   │      │  │
│   │   │   AWS Lambda (CRUD + Relatórios) │ ───────────────────────────────► │ S3 Bucket│   │   │      │  │
│   │   └──────────────────────────────────┘        (Comunicação gratuita)    └──────────┘   │   │      │  │
│   │                    │                                                                   │   │      │  │
│   │                    │ Conexão (Porta 5432 / SG-RDS)                                     │   │      │  │
│   │                    ▼                                                                   │   │      │  │
│   │   ┌──────────────────────────────────┐                                                 │   │      │  │
│   │   │     Amazon RDS (PostgreSQL)      │                                                 │   │      │  │
│   │   │     (db.t3.micro - Privado)      │                                                 │   │      │  │
│   │   └──────────────────────────────────┘                                                 │   │      │  │
│   │                                                                                        │   │      │  │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │      │  │
└────────────────────────────────────────────────────────────────────────────────────────────────┴──────┘  │
                                                                                                           │
                                                                                                           │
                                   4. Atualiza URL da Thumbnail no RDS                                     │
                                   ────────────────────────────────────────────────────────────────────────┘

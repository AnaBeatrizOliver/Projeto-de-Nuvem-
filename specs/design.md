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
└───────────────────────────┘                       └───────────────────────────┘                │
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
│   │   │   AWS Lambda (CRUD + Relatórios) │ ───────────────────────────────► │  S3 Bucket│  │   │      │  │
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


-- Tabela de Veterinários
CREATE TABLE veterinarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    crmv VARCHAR(20) UNIQUE NOT NULL,
    especialidade VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tutores
CREATE TABLE tutores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pets
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL,
    veterinario_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    especie VARCHAR(30) NOT NULL,
    raca VARCHAR(50),
    idade INT,
    peso DECIMAL(5,2),
    foto_url TEXT,
    foto_thumbnail_url TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tutor FOREIGN KEY (tutor_id) REFERENCES tutores(id) ON DELETE RESTRICT,
    CONSTRAINT fk_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT
);

                                   

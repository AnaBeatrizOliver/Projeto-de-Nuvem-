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

---

## 2. Modelo Entidade-Relacionamento (ER)

### Tabela: `veterinarios`
* `id` (PK, Serial / Auto-increment)
* `nome` (VARCHAR 100, NOT NULL)
* `crmv` (VARCHAR 20, UNIQUE, NOT NULL)
* `especialidade` (VARCHAR 50)

### Tabela: `tutores`
* `id` (PK, Serial / Auto-increment)
* `nome` (VARCHAR 100, NOT NULL)
* `cpf` (VARCHAR 14, UNIQUE, NOT NULL)
* `telefone` (VARCHAR 20, NOT NULL)
* `email` (VARCHAR 100)

### Tabela: `pets`
* `id` (PK, Serial / Auto-increment)
* `tutor_id` (FK -> tutores.id, NOT NULL)
* `veterinario_id` (FK -> veterinarios.id, NOT NULL)
* `nome` (VARCHAR 50, NOT NULL)
* `especie` (VARCHAR 30, NOT NULL)
* `raca` (VARCHAR 50)
* `idade` (INT)
* `peso` (DECIMAL 5,2)
* `foto_url` (TEXT)
* `foto_thumbnail_url` (TEXT)

---

## 3. Rotas da API (API Gateway + Lambda)

| Método | Rota | Descrição | Requisito |
| :--- | :--- | :--- | :--- |
| `GET` | `/tutores` | Lista todos os tutores | RF-01 |
| `POST` | `/tutores` | Cadastra um novo tutor | RF-01 |
| `GET` | `/pets` | Lista todos os pets (com dados do tutor e vet) | RF-01 |
| `POST` | `/pets` | Cadastra um novo pet | RF-01 |
| `POST` | `/pets/{id}/upload-url` | Gera URL pré-assinada do S3 para a foto | RF-02 |
| `GET` | `/relatorios/especie-veterinario` | Consulta com JOIN e GROUP BY | RF-04 |

---

## 4. Configuração de Security Groups

* **SG-API-Lambda**:
  * Outbound: Permite tráfego para `SG-RDS` na porta do banco (ex: 5432).
* **SG-RDS (Banco de Dados)**:
  * Inbound: Permite tráfego na porta 5432 **APENAS** vindo do `SG-API-Lambda`.
  * Outbound: Nenhum.

---

## 5. Architectural Decision Record (ADR) - RNF-04

* **Título:** Opção por Arquitetura Serverless (AWS Lambda + API Gateway) para a API principal.
* **Contexto:** Necessidade de disponibilizar os endpoints da aplicação de forma resiliente às reinicializações de sessão do AWS Learner Lab, que alteram IPs públicos de instâncias EC2.
* **Decisão:** Optou-se por utilizar **AWS Lambda e API Gateway** em vez de uma instância EC2 dedicada.
* **Justificativa:**
  1. **URL Estática Garantida:** O API Gateway fornece um endpoint HTTP fixo, eliminando a necessidade de atualizar o IP da aplicação no front-end a cada nova sessão do Learner Lab (atendendo ao RNF-03).
  2. **Custo e Limites no Learner Lab:** Evita o consumo contínuo de instâncias EC2 e simplifica o gerenciamento do ecossistema.
  3. **Conexão Segura com RDS:** As Lambdas operam associadas às subnets privadas da VPC para comunicação direta com o Amazon RDS via Security Group estrito.
  4. **Acesso ao S3:** Para evitar custos com NAT Gateway, utiliza-se o **VPC Gateway Endpoint** (gratuito) para comunicação direta da Lambda com o Amazon S3.
    CONSTRAINT fk_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinarios(id) ON DELETE RESTRICT
);

                                   

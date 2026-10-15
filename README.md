# Projeto-de-Nuvem-

# VetCare — Sistema de Gestão Veterinária 🐾

O **VetCare** é um sistema para gestão de clínicas veterinárias, desenvolvido como projeto prático para a disciplina de Computação em Nuvem (AWS Learner Lab).

O sistema permite o cadastro e controle de **Tutores**, **Pets** e **Veterinários**, suporte a upload e geração de miniaturas de fotos de perfil dos animais, além da geração de relatórios gerenciais consolidados.

---

## 🌐 Protótipo em Produção (AWS S3)

O protótipo estático do front-end está hospedado e ativo no Amazon S3 via *Static Website Hosting*:

🔗 **[Acessar Protótipo do VetCare no AWS S3](http://vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com/#)**

---

## 📐 Arquitetura da Solução

A solução foi projetada utilizando uma **arquitetura Serverless** na AWS para garantir alta disponibilidade, URLs permanentes e isolamento de segurança:

```text
 [ Usuário / Navegador ]
        │
        ├───► Amazon S3 (Hospedagem Estática - Front-end)
        │
        └───► Amazon API Gateway (Endpoint HTTPS Fixo)
                    │
                    ▼
              AWS Lambda (Regras de Negócio em Subnet Privada)
                    │
                    ├───► Amazon RDS (PostgreSQL Privado)
                    │
                    └───► VPC Gateway Endpoint ──► S3 (Fotos)
```

### Principais Componentes:

* **Front-end:** Hospedado no **Amazon S3** (Hospedagem Estática).
* **API Backend:** **Amazon API Gateway** + **AWS Lambda** (Python/Node.js).
* **Banco de Dados:** **Amazon RDS (PostgreSQL)** em subnets privadas, acessível exclusivamente via Lambda.
* **Processamento Assíncrono:** Evento do S3 dispara uma função Lambda dedicada para gerar miniaturas (*thumbnails*) de 150x150 px.

---

## 📁 Estrutura do Repositório

```text
.
├── docs/
│   ├── assets/               # Imagens de personas e diagramas
│   └── ia-log.md             # Registro de interações e decisões tomadas com IA
├── specs/
│   ├── spec.md               # Especificação funcional, Personas e Histórias de Usuário
│   └── design.md             # Arquitetura detalhada, Modelo ER, Script DDL, Rotas e ADR
├── src/
│   └── index.html            # Código-fonte do front-end (Landing Page)
└── README.md                 # Documentação principal do repositório
```

---

## 📄 Documentação Técnica Detalhada

* 📋 **[Especificação do Projeto (`specs/spec.md`)](./specs/spec.md):** Contém os Requisitos Funcionais (RF-01 a RF-05), Requisitos Não-Funcionais (RNF-01 a RNF-05), Personas e Histórias de Usuário.
* 🏗️ **[Design e Arquitetura (`specs/design.md`)](./specs/design.md):** Contém o Diagrama AWS, DDL SQL do PostgreSQL (`veterinarios`, `tutores`, `pets`), definição de Rotas REST, Security Groups e a **ADR-001** (Adoção de Serverless).
* 🤖 **[Registro de Uso de IA (`docs/ia-log.md`)](./docs/ia-log.md):** Histórico detalhado de prompts, refinamentos e validações com IA para a Aula 1 e Aula 2.
* 📋 **Códigos e estrutura do site (`src/index.html`)](./src/index.html):** Contém o código do site que está hospedagem estática 
---

## 👥 Equipe e Disciplina

* **Curso:** Sistemas de Informação / Serviços em Nuvem
* **Ambiente:** AWS Learner Lab
* **Participantes:** Ana Beatriz Pereira de Oliveira - 10444937

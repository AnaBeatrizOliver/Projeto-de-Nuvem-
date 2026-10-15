# Registro de Uso de Inteligência Artificial (ia-log.md)

Este documento registra os prompts, decisões, revisões e refinamentos realizados em parceria com a IA para a especificação e arquitetura do **Projeto 2 (Clínica Veterinária - VetCare)**, em conformidade com as orientações do projeto.

---

## Sessão 1: Definição do Domínio e Estruturação Inicial (Aula 1 - 09/10/2026)

### 1. Definição do Domínio de Negócio
* **Prompt do Usuário:**
  > "Olá, me ajude a desenvolver esse projeto [enunciado completo do Projeto 2 enviado]. Vamos começar por partes. Quero que você me auxilie, mas quero a todo momento opinar e escolher detalhes do projeto. Vamos começar para o 09/10."
* **Resposta da IA:**
  * Apresentou 3 opções de domínio de negócio (Oficina Mecânica, Clínica Veterinária e Gestão de Eventos) com exemplos práticos de como atender a todos os requisitos do projeto (RF-01 a RF-05).
* **Decisão do Grupo (Usuário):**
  * Escolheu a **Opção B: Clínica Veterinária**.

---

### 2. Refinamento das Entidades e Fluxo de Imagens
* **Prompt do Usuário:**
  > "1 - Gostei do tutor e pet, mas acho legal um veterinario por pet , daria para fazer algo assim ? / 2 - Gostei da ideia das fotos."
* **Resposta da IA:**
  * Validou a ideia de adicionar a entidade `Veterinário` e apresentou opções de modelagem, ajustando o escopo para:
    * **RF-01:** CRUD de `Tutores` (1) ➔ (`N`) `Pets` com vínculo ao `Veterinário`.
    * **RF-02:** Upload da foto de perfil do pet para o Amazon S3 via URL pré-assinada.
    * **RF-03:** Disparo de AWS Lambda ao subir a foto no S3 para gerar miniatura (*thumbnail*) e atualizar a URL no Amazon RDS.
    * **RF-04:** Relatório exposto via API Gateway + Lambda com `JOIN` e `GROUP BY` (pets por espécie e veterinário).

---

### 3. Elaboração da Especificação (`specs/spec.md`)
* **Prompt do Usuário:**
  > "Me dê o specs.md" -> Seguido de: "Melhore esses requisitos, deixe com uma linguagem mais natural e traga pontos mais necessários de funcionalidades" -> E por fim: "Pode mandar a estrutura como antes , gostei mais da organização , achei mais direta".
* **Resposta da IA:**
  * Estruturou e refinou o arquivo `specs/spec.md` contendo:
    1. Problema e objetivo do sistema VetCare.
    2. Personas (Dra. Camila Rocha - Veterinária e Lucas Mendes - Recepcionista).
    3. Tabela de mapeamento dos requisitos funcionais (RF-01 a RF-05) e não-funcionais (RNF-01 a RNF-05).
    4. Histórias de usuário diretas (US-01 a US-05) com critérios de aceite detalhados e regras de negócio reais (validação de CPF, limite de tamanho de imagem, etc.).
* **Decisão do Grupo (Usuário):**
  * Aprovou a estrutura direta e organizada do arquivo `specs/spec.md`.

---

## Síntese do Contexto e Decisões de Arquitetura

* **Domínio Selecionado:** Clínica Veterinária (VetCare).
* **Entidades do Banco (RDS):** `Tutor`, `Pet` e `Veterinario`.
* **Upload S3:** Foto do perfil do pet via Pre-signed URL.
* **Processamento Assíncrono:** S3 Event Trigger ➔ Lambda (Miniatura) ➔ Atualização no RDS.
* **Relatório:** SQL com `JOIN` entre as 3 tabelas e `GROUP BY`.
* **Restrições AWS Learner Lab:** Uso exclusivo da `LabRole` / `LabInstanceProfile`, RDS privado, sem IP fixo e sem ferramentas de IaC.

---

## Sessão 2: Design Técnico, Implantação no S3 e Finalização (Aula 2 - 16/10/2026)

### 1. Elaboração do Design e Arquitetura (`specs/design.md`)
- **Prompt do Usuário:**
  > "Agora vamos para a Aula 2. Me ajude a criar a documentação técnica de arquitetura, o modelo relacional e o script DDL em PostgreSQL para o VetCare."
- **Resposta da IA:**
  * Elaborou o arquivo `specs/design.md` contendo:
    1. Diagrama ASCII da arquitetura Serverless (S3, API Gateway, Lambda, RDS em subnet privada e S3 Trigger).
    2. Esquema relacional com DDL SQL completo para as tabelas `veterinarios`, `tutores` e `pets` com chaves estrangeiras (`FOREIGN KEY`).
    3. Mapeamento detalhado das rotas REST da API e regras dos Security Groups na VPC.
    4. Registro de Decisão de Arquitetura (**ADR-001: Adoção de Arquitetura Serverless**).

---

### 2. Desenvolvimento e Publicação da Landing Page no S3
- **Prompt do Usuário:**
  > "Preciso do código da landing page do VetCare em HTML/CSS para colocar no ar. Como faço o passo a passo no console da AWS para criar o bucket e colocar o site no ar?"
- **Resposta da IA:**
  * Forneceu o código `index.html` responsivo e intuitivo, destacando as funcionalidades do sistema e a arquitetura em nuvem.
  * Guiou o processo passo a passo no console da AWS Learner Lab:
    1. Ativação do ambiente e navegação até o serviço **Amazon S3**.
    2. Criação do bucket público com permissões de leitura ajustadas.
    3. Habilitação do recurso **Static Website Hosting** com documento de índice `index.html`.
    4. Aplicação da **Bucket Policy** de acesso público (`s3:GetObject`).
    5. Upload do arquivo `index.html` e validação do endpoint público gerado.
- **Decisão do Grupo (Usuário):**
  * Realizou a implantação prática e confirmou a inicialização do protótipo no S3 com sucesso.

---

### 3. Organização e Padronização do Repositório (`README.md`)
- **Prompt do Usuário:**
  > "Vamos organizar o README.md para a entrega. Quero um código MD limpo para colar direto no GitHub com a arquitetura e o link do S3."
- **Resposta da IA:**
  * Estruturou o arquivo `README.md` principal com cabeçalho, resumo do projeto, link público do protótipo no S3, diagrama de arquitetura formatado em bloco de texto, árvore de diretórios e referências aos documentos internos (`spec.md`, `design.md` e `ia-log.md`).

---

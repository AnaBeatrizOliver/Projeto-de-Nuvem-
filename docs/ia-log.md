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

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

## Sessão 3: Revisão após o Feedback da Aula 2 (17/10/2026)

Nesta sessão o grupo revisou os artefatos a partir do feedback do professor na apresentação de 16/10. A IA foi usada como revisora crítica, e todas as propostas foram avaliadas antes de entrar no repositório.

---

### 1. Análise crítica do `spec.md`
* **Prompt do Usuário:**
  > "Vê primeiro o arquivo spec.md e me diga mais sobre o que acha. Ontem meu professor deu um feedback do que pode melhorar; espero que você também tenha esse mesmo olhar analítico."
* **Resposta da IA:**
  * Apontou que os critérios de aceite não eram testáveis ("instantaneamente", "telefone válido", "tratada a integridade").
  * Identificou que o gatilho `s3:ObjectCreated:*` com a miniatura salva no mesmo bucket causaria um **loop infinito** de execuções da Lambda.
  * Apontou que o CRUD de pets estava incompleto (sem editar e excluir) e que não havia definição de como os veterinários seriam cadastrados.
  * Apontou que o problema citava "agendamentos e histórico", mas nenhuma história cobria esses pontos.
* **Decisão do Grupo:**
  * **Aceitou** todas as correções. O loop e o CRUD incompleto foram registrados como erros da versão gerada na Sessão 1 que o grupo não havia percebido.

---

### 2. Requisitos além dos mínimos (feedback do professor)
* **Prompt do Usuário:**
  > "Meu professor disse que só colocamos os requisitos mínimos que ele passou. Tem algum requisito a mais que poderia ser adicionado? Quero que seja um projeto bom, porém não tão complexo."
* **Resposta da IA:**
  * Propôs requisitos do domínio que reaproveitam a infraestrutura já planejada: **consultas** (com relação N:N entre pets e veterinários), **histórico do pet**, **conflito de horário**, **busca e filtros**, **inativação de pet** e **proteção de dados pessoais (LGPD)**.
  * Listou como opcionais a carteira de vacinação e um segundo relatório, e recomendou não incluir login (Cognito), notificações por e-mail/SMS e módulo financeiro.
* **Decisão do Grupo:**
  * **Aceitou** consultas, histórico, conflito de horário, busca, inativação e LGPD.
  * **Rejeitou** carteira de vacinação, login, notificações e financeiro, para manter o escopo viável no prazo e no orçamento do Learner Lab.

---

### 3. Restrições do AWS Learner Lab
* **Prompt do Usuário:**
  > "Vou te passar as limitações do Learner Lab; pode usar como base para me ajudar a ter uma base melhor sobre o trabalho e como vai funcionar."
* **Resposta da IA:**
  * Relacionou as restrições que afetam o projeto: região `us-east-1`, uso obrigatório da `LabRole`, limite de 10 execuções simultâneas de Lambda, RDS que não para sozinho e religa após 7 dias, Enhanced Monitoring não suportado.
  * Mostrou que o **Secrets Manager**, a partir de uma Lambda em subnet privada, exigiria um Interface Endpoint cobrado por hora, e sugeriu variáveis de ambiente para as credenciais.
  * Recomendou o driver `pg8000` (Python puro) no lugar do `psycopg2`, que costuma falhar no empacotamento para Lambda.
  * **Corrigiu uma afirmação própria anterior:** havia dito que o SNS era restrito no Learner Lab, mas a lista oficial mostra que ele é permitido (apenas o SES não aparece).
* **Decisão do Grupo:**
  * **Aceitou** as restrições como base das decisões de arquitetura (registradas nos ADRs do `design.md`).

---

### 4. Reescrita do `spec.md`
* **Prompt do Usuário:**
  > "Faça essa reescrita dos requisitos, por gentileza."
* **Resposta da IA:**
  * Gerou uma versão com os critérios de aceite no formato **Dado / Quando / Então** e códigos HTTP esperados, mas incluiu também seções de restrições do ambiente, detalhes de implementação dos RNFs, regras de negócio separadas e uma matriz de rastreabilidade.
* **Decisão do Grupo:**
  * **Rejeitou** a estrutura proposta: o enunciado define que o `spec.md` contém apenas *problema, personas, histórias com critérios de aceite e como os RF-01 a RF-05 se aplicam ao domínio*.
  * **Corrigido:** os detalhes técnicos foram movidos para o `design.md`, as regras de negócio viraram critérios de aceite dentro das histórias, e a seção de requisitos foi reorganizada em três tabelas: RF-01 a RF-05 (mínimos), RF-06 a RF-09 (domínio) e RNF-01 a RNF-06 (o que cada um exige, sem o "como").

---

### 5. Cenários de borda nas histórias de usuário
* **Prompt do Usuário:**
  > "Nas user stories, você acha que tem alguma outra sugestão ou somente aquilo é suficiente para os cenários possíveis que podem acontecer?"
* **Resposta da IA:**
  * Sugeriu 14 cenários, entre eles: remarcar uma consulta sem conflitar com ela mesma, consultas que apenas se encostam (10:00–10:30 e 10:30) não são conflito, o mesmo pet em duas consultas simultâneas, dois agendamentos enviados ao mesmo tempo, CPF com e sem pontuação, horário de funcionamento e o que acontece com consultas futuras de um pet inativado.
* **Decisão do Grupo:**
  * **Aceitou** os 14 cenários e **definiu** as regras em aberto: atendimento de **segunda a sábado, das 8h às 18h**; inativar um pet **cancela automaticamente** suas consultas futuras; pets inativos **podem ser reativados**.

---

### 6. Atualização do `design.md`
* **Prompt do Usuário:**
  > "Agora preciso ajustar o design.md, porque está ligado diretamente com o spec.md, correto?"
* **Resposta da IA:**
  * Reescreveu as cinco seções exigidas: diagrama de arquitetura (agora com subnets públicas e privadas), modelo ER com a tabela `consultas`, rotas completas de CRUD, Security Groups e ADRs.
  * Propôs uma **EC2 de administração (bastion)** na subnet pública para executar os scripts SQL no RDS privado.
  * Propôs garantir o conflito de agenda no **próprio banco** (restrição `EXCLUDE`), explicando que uma verificação apenas no código permitiria dois agendamentos simultâneos no mesmo horário.
  * Registrou quatro ADRs: Lambda × container (RNF-04), credenciais em variáveis de ambiente, bucket de fotos privado e conflito de agenda no banco.
* **Decisão do Grupo:**
  * **Aceitou**, com a ressalva de testar logo no primeiro script se o Learner Lab permite criar as extensões `btree_gist` e `unaccent`. O ADR-004 registra a alternativa caso não permita.
  * O grupo questionou se o GitHub exibe diagramas Mermaid. A IA confirmou e **validou a renderização** dos três diagramas antes do envio.

---

### 7. Verificação de coerência entre os artefatos
* **Prompt do Usuário:**
  > "Precisamos verificar tudo antes para ver se está de acordo."
* **Resposta da IA:**
  * Encontrou **três incoerências entre o `spec.md` e o `design.md` que ela mesma havia gerado**:
    1. A spec dizia que uma foto corrompida não alterava o cadastro, mas o design trocava a foto antes de gerar a miniatura.
    2. A spec prometia busca sem diferenciar acentos, mas o design não dizia como.
    3. A spec proibia CPF e telefone nos logs, mas o design não mencionava isso.
  * Apontou textos desatualizados na landing page (falta do módulo de consultas, "Prontuário", jargão técnico e datas erradas).
* **Decisão do Grupo:**
  * **Corrigido:** a Lambda de miniatura só troca a foto após o sucesso, mantendo a anterior em caso de erro; a extensão `unaccent` foi incluída no schema; a regra dos logs foi documentada.
  * **Aceitou** os ajustes da landing page.

---

### 8. Reorganização do `README.md`
* **Prompt do Usuário:**
  > "Vamos para a parte do README.md."
* **Resposta da IA:**
  * Gerou uma versão com a localização dos artefatos, a estrutura do repositório, um resumo da arquitetura (apontando para o `design.md`), o passo a passo de publicação no S3 pelo console e pela CLI, o checklist de orçamento e a equipe.
  * Em seguida, reduziu o README apenas ao passo a passo.
* **Decisão do Grupo:**
  * **Rejeitou** a versão reduzida e manteve a versão completa.
  * **Removeu** a seção "Próximas etapas", pois o planejamento pertence ao `tasks.md`; os passos de VPC, RDS e Lambda serão acrescentados ao README na entrega de 23/10.

---

## Síntese da Sessão 3

| Tipo | Itens |
| :--- | :--- |
| **Aceito** | Requisitos do domínio (consultas, histórico, busca, inativação, LGPD); critérios em Dado/Quando/Então; 14 cenários de borda; arquitetura com bastion; conflito de agenda no banco; ADRs 001 a 004 |
| **Rejeitado** | Vacinas, login, notificações e financeiro; spec com detalhes técnicos misturados; README reduzido |
| **Corrigido** | Loop infinito da Lambda de miniatura; CRUD incompleto; três incoerências entre spec e design; afirmação incorreta da IA sobre o SNS |

**Aprendizado do grupo:** a IA gera documentos completos rapidamente, mas cometeu erros que só apareceram na revisão: o loop da miniatura, as incoerências entre os próprios documentos e conteúdo fora do escopo pedido pelo enunciado. Por isso, o grupo passou a conferir cada artefato contra o enunciado e contra os demais documentos antes de aceitá-lo.

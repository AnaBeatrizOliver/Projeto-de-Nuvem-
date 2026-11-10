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

### 9. Histórias de usuário mais enxutas
* **Prompt do Usuário:**
  > "Nessa parte do spec.md, meu grupo disse que tem código (o JSON) e também que as user stories ficaram um pouco grandes. Preciso que você me ajude a entender melhor, mas sem perder as funcionalidades."
* **Resposta da IA:**
  * Explicou que as histórias estavam longas por três motivos: detalhes técnicos na spec (o JSON de resposta e os códigos HTTP como 201, 400 e 409), regras repetidas em várias histórias (confirmação antes de excluir, registro não encontrado) e o formato Dado/Quando/Então, que usa três frases para cada regra simples.
  * Reescreveu a seção 4 com critérios diretos, escritos do ponto de vista do usuário, e criou uma lista de **regras gerais** válidas para todas as histórias.
  * Substituiu o JSON do relatório por uma tabela de exemplo e moveu o JSON para a seção de rotas do `design.md`, onde os códigos HTTP já estavam documentados.
* **Decisão do Grupo:**
  * **Corrigido:** os critérios de aceite passaram de 63 para 39, sem remover nenhuma funcionalidade. O `spec.md` deixou de conter código, e os detalhes técnicos ficaram concentrados no `design.md`.
  * Também foi corrigida a numeração da seção 3 do `spec.md` (de 3.1/3.3 para 3.1/3.2).

---

## Síntese da Sessão 3

| Tipo | Itens |
| :--- | :--- |
| **Aceito** | Requisitos do domínio (consultas, histórico, busca, inativação, LGPD); critérios em Dado/Quando/Então; 14 cenários de borda; arquitetura com bastion; conflito de agenda no banco; ADRs 001 a 004 |
| **Rejeitado** | Vacinas, login, notificações e financeiro; spec com detalhes técnicos misturados; README reduzido |
| **Corrigido** | Loop infinito da Lambda de miniatura; CRUD incompleto; três incoerências entre spec e design; afirmação incorreta da IA sobre o SNS; histórias de usuário longas e com código (JSON e códigos HTTP) no `spec.md` |

**Aprendizado do grupo:** a IA gera documentos completos rapidamente, mas cometeu erros que só apareceram na revisão: o loop da miniatura, as incoerências entre os próprios documentos, conteúdo fora do escopo pedido pelo enunciado e textos mais longos e técnicos do que o necessário. Por isso, o grupo passou a conferir cada artefato contra o enunciado e contra os demais documentos antes de aceitá-lo.

---

## Sessão 4: Implementação da Infraestrutura e do CRUD (Aula 3 - 23/10/2026)

Nesta sessão o grupo implantou a infraestrutura na AWS e o CRUD do RF-01. Foram usadas duas IAs: o **Gemini**, como guia passo a passo no console, e o **Claude**, para revisar o que foi criado e corrigir o código e a documentação.

---

### 1. Criação da VPC, da EC2 e do RDS (guia do Gemini)
* **Prompt do Usuário (Nicholas):**
  > "Me ajude a implementar o que falta no ambiente da AWS me guiando com um passo a passo bem detalhado. Meu conhecimento em AWS é bem inicial, então não pule etapas."
* **Resposta da IA:**
  * Guiou a criação da `vetcare-vpc` pelo assistente *VPC and more* (1 subnet pública, 1 privada, **sem NAT Gateway**), da EC2 Ubuntu `t3.micro` na subnet pública e do RDS **MySQL** `db.t3.micro` com *Public access = No*.
  * Orientou a regra do `vetcare-rds-sg` usando o **security group da EC2** como origem, em vez de um IP.
* **Decisão do Grupo:**
  * **Aceitou** a estrutura de rede e os security groups.
  * **Corrigido:** a primeira tentativa de criar o RDS falhou com "a instância do banco e o grupo de segurança da EC2 estão em VPCs diferentes". O grupo identificou que o formulário estava usando a VPC padrão e refez a criação na `vetcare-vpc`.
  * **Corrigido:** o grupo removeu uma regra que liberava a porta 3306 para o IP da casa de um integrante, mantendo apenas o security group da EC2.
  * O banco ficou como **MySQL**, e não PostgreSQL como previa o design de 16/10. A mudança foi registrada no ADR-003.

---

### 2. Back-end gerado pelo Gemini
* **Prompt do Usuário (Nicholas):**
  > "Eu não tenho uma aplicação do back-end, tenho apenas a landing page do meu projeto. Me ajude a criar o back-end para a minha aplicação."
* **Resposta da IA:**
  * Gerou um servidor Node.js/Express rodando na EC2 com CRUD de tutores e pets, criando as tabelas automaticamente ao iniciar.
* **Decisão do Grupo:** na revisão com o Claude, o grupo **rejeitou** partes desse código:
  * **Senha do banco escrita no `server.js`** e digitada no chat, que depois foi compartilhado por link. Isso viola o RNF-02. A senha do RDS foi **trocada**, e a configuração passou para um arquivo `.env` que existe somente na EC2 (ADR-002).
  * **Tabelas criadas dentro do código**, quando o enunciado pede **scripts SQL versionados**. Foi criado o script `sql/schema.sql`, com as tabelas e a carga inicial dos veterinários.
  * **`ON DELETE CASCADE`** (excluir um tutor apagava os pets), o que contradiz a US-01. Foi trocado por `ON DELETE RESTRICT`, com a mensagem "Tutor possui pets cadastrados".
  * O modelo não tinha veterinário responsável e usava idade em vez de data de nascimento. Foi alinhado ao `design.md`.
  * O endereço do **site no S3** havia sido colado no lugar do endpoint do RDS, causando o erro `EAI_AGAIN`. O grupo aprendeu a obter o endpoint correto pelo console ou pela CLI.

---

### 3. Revisão da infraestrutura com o Claude
* **Prompt do Usuário (Isaac):**
  > "Nesse chat mostra tudo o que foi criado, me diga se tem algo de errado."
* **Resposta da IA:**
  * Analisou o chat do Gemini e, a partir de um comando de leitura executado no CloudShell, conferiu VPC, subnets, tabelas de rotas, security groups, EC2 e RDS.
  * Confirmou que a rede estava correta (subnet privada só com rota `local`, sem NAT Gateway, RDS sem acesso público).
  * Apontou que o SSH da EC2 estava aberto para `0.0.0.0/0` e que o assistente do RDS havia criado security groups extras (`ec2-rds-1` / `rds-ec2-1`) e subnets `RDS-Pvt-subnet-1..5`.
* **Decisão do Grupo:**
  * **Aceitou** restringir o SSH à faixa do EC2 Instance Connect e documentar os recursos criados automaticamente.

---

### 4. Decisão: CRUD em EC2 em vez de Lambda (RNF-04)
* **Contexto:** o `design.md` de 16/10 previa o CRUD em Lambda + API Gateway, mas a implementação foi feita em EC2.
* **Resposta da IA:** apresentou duas opções: refazer o CRUD em Lambda (sem tempo hábil para a entrega) ou manter a EC2 e atualizar a documentação. Mostrou que a EC2 atende ao RNF-03, porque as telas chamam a API por caminho relativo (`/api/...`), sem IP no código.
* **Decisão do Grupo:**
  * **Aceitou** manter a EC2 e **reescreveu o ADR-001**, registrando as alternativas e as desvantagens (IP muda a cada sessão, instância consome orçamento).
  * As Lambdas continuam no projeto para o RF-03 (miniatura) e o RF-04 (relatório), em 30/10.

---

### 5. Código revisado: API, telas e scripts SQL
* **Prompt do Usuário (Isaac):**
  > "Me diga tudo o que preciso fazer para resolver."
* **Resposta da IA:**
  * Gerou um novo `server.js` com validações, mensagens de erro claras, CPF mascarado na listagem e logs sem dados pessoais; as telas de tutores e pets; os scripts SQL; e um script para instalar tudo na EC2 sem senhas.
  * Testou a aplicação em um banco MySQL local antes de entregar e encontrou um erro: sem `SET NAMES utf8mb4` no script, a espécie "Cão" era gravada com acento quebrado e a restrição `CHECK` recusava o cadastro. O script foi corrigido.
* **Decisão do Grupo:**
  * **Aceitou** o código, depois de testar na EC2.

---

### 6. Erro de acesso ao banco
* **Prompt do Usuário (Isaac):**
  > "ERROR 1045 (28000): Access denied for user 'admin'... consegue me ajudar a resolver esse problema?"
* **Resposta da IA:**
  * Explicou que o erro era de usuário ou senha, e não de rede (a EC2 chegou até o banco, o que confirmou que os security groups estavam corretos), e listou as causas prováveis: troca de senha ainda em andamento, erro de digitação no terminal do navegador ou usuário diferente.
  * Sugeriu testar usando a senha do `.env` (variável `MYSQL_PWD`) para eliminar erros de digitação.

---

### 7. CPF fictício
* **Prompt do Usuário (Isaac):**
  > "Existe a chance de tirar essa validação de CPF, e ao invés de ser um CPF verdadeiro pode ser um fictício?"
* **Resposta da IA:**
  * Removeu o cálculo dos dígitos verificadores, mantendo a exigência de 11 dígitos e a regra de CPF único.
* **Decisão do Grupo:**
  * **Aceitou** e **corrigiu** o critério 1 da US-01 no `spec.md` ("CPF com 11 dígitos; CPFs fictícios são aceitos"), para manter a spec coerente com o código.

---

## Síntese da Sessão 4

| Tipo | Itens |
| :--- | :--- |
| **Aceito** | VPC sem NAT Gateway; RDS privado; regras de security group por ID de grupo; CRUD em EC2 (ADR-001 revisado); código revisado com validações; CPF fictício |
| **Rejeitado** | Senha no código e no chat; tabelas criadas pelo código; `ON DELETE CASCADE`; regra de banco liberada para IP pessoal |
| **Corrigido** | RDS criado na VPC errada; endpoint do S3 usado como endereço do banco; acento quebrado no script SQL; SSH aberto para a internet; design, README e spec atualizados para EC2 e MySQL |

**Aprendizado do grupo:** seguir uma IA passo a passo sem revisar levou a problemas sérios de segurança (senha exposta) e a divergências com a documentação. Revisar o código gerado e conferir a infraestrutura real contra o `design.md` antes de gravar o vídeo evitou entregar algo incoerente.

---

## Sessão 5: Preparação do Vídeo e Entrega Final (25/10 e 05/11/2026)

### 1. Roteiro do vídeo de 23/10
* **Prompt do Usuário (Isaac):**
  > "Preciso da sua ajuda para montar o vídeo da apresentação de forma que resuma tudo o que o professor pediu e que não seja muito difícil de explicar."
* **Resposta da IA:**
  * Montou um roteiro de cerca de 4min30, na ordem dos critérios de avaliação (rede, banco, CRUD com persistência, segurança e documentação), indicando em cada tela onde clicar e o que falar.
  * Preparou os comandos do terminal para mostrar a estrutura das tabelas e comprovar a persistência com um `SELECT` com JOIN.
* **Decisão do Grupo:**
  * **Corrigido:** a primeira versão das falas ficou curta demais e com tom robotizado; o grupo pediu um texto mais natural, que foi reescrito em tom de conversa.
  * **Aceito:** a organização das abas do navegador na ordem do roteiro e a separação entre o terminal do servidor e o terminal de consultas ao banco.

---

### 2. Revisão do que faltava para a entrega final
* **Prompt do Usuário (Isaac):**
  > "O que está faltando para terminar o projeto?"
* **Resposta da IA:**
  * Comparou o enunciado com o repositório e mostrou que os requisitos da entrega de 30/10 (RF-02 upload, RF-03 Lambda disparada pelo S3, RF-04 relatório no API Gateway) ainda não tinham sido implementados, além das consultas previstas na spec.
  * Encontrou um erro no repositório: o `.gitignore` estava escrito `t .env`, ou seja, **não protegia** o arquivo com a senha do banco.
  * Apresentou duas opções: um relatório simplificado sem consultas, ou implementar consultas para manter spec, design e código coerentes.
* **Decisão do Grupo:**
  * **Aceitou** a opção completa, implementando consultas, upload, miniatura e relatório.
  * **Corrigido:** o `.gitignore` passou a bloquear `.env`, `node_modules/` e os pacotes `.zip`.

---

### 3. Implementação de fotos, consultas, Lambdas e relatório
* **Prompt do Usuário (Isaac):**
  > "Vamos fazer o que está faltando, pois eu preciso tirar uma nota muito boa."
* **Resposta da IA:**
  * Gerou a nova versão do `server.js` (URL pré-assinada do S3, consultas com controle de conflito por transação e `SELECT ... FOR UPDATE`, histórico do pet, inativação que cancela consultas futuras), as telas de consultas, histórico, foto e relatório, o `schema.sql` com a tabela `consultas` e as duas Lambdas (`vetcare-miniatura` e `vetcare-relatorio`).
  * Propôs as Lambdas em **Node.js 22 com Jimp**, em vez de Python com Pillow, para evitar a necessidade de uma *Lambda Layer* compilada (ADR-006).
  * Testou tudo antes de entregar: a API contra um banco MySQL local, a Lambda de miniatura com um S3 simulado (imagem válida, arquivo corrompido, pet inexistente e arquivo fora de `uploads/`) e as telas em um navegador automatizado.
  * Separou os passos da AWS que não dependiam do código (bucket, `LabInstanceProfile`, Security Group das Lambdas e Gateway Endpoint) para o grupo fazer em paralelo.
* **Decisão do Grupo:**
  * **Aceito:** a arquitetura com as Lambdas na VPC usando o Gateway Endpoint e o `vetcare-lambda-sg`.
  * **Aceito, com ajuste na spec:** para o relatório ter dados reais na demonstração, foi incluída a opção de **registrar um atendimento já realizado (encaixe)**, que virou o critério 7 da US-06.
  * **Corrigido durante a revisão de coerência:** a spec pedia filtro de pets por tutor, que não existia na tela; o filtro foi acrescentado. O histórico do pet passou a se atualizar depois da inativação.
  * **Aceito:** a atualização do `design.md` (diagrama, rotas, Security Groups e ADR-004 a ADR-006), do `README.md` e do `tasks.md` para refletir o que está rodando.

---

### 4. Configuração na AWS e testes de ponta a ponta
* **Prompt do Usuário (Isaac):**
  > "Pronto, terminei de configurar tudo essa parte do vetcare-relatorio." (seguido de prints de cada etapa)
* **Resposta da IA:**
  * Analisou o teste da Lambda de relatório: a resposta 500 demorou cerca de 10 segundos, o tempo limite de conexão do MySQL. Concluiu que era **rede, não código**: faltava a regra da porta 3306 do `vetcare-lambda-sg` no `vetcare-rds-sg`. Depois da correção, o log passou a mostrar `ER_NO_SUCH_TABLE` em 140 ms, provando que a Lambda já alcançava o RDS.
  * Ao subir o servidor na EC2, percebeu pelos logs que ainda rodava a **versão antiga** do `server.js` (faltavam as linhas de bucket e relatório) e orientou baixar o repositório de novo.
  * Identificou que o comando `cat >> .env <<'EOF'` travou o terminal porque o texto colado veio com espaços antes do `EOF`, e o substituiu por um `printf` de uma linha.
  * Conferiu os prints das evidências um a um e organizou os arquivos em `docs/evidencias/`.
* **Decisão do Grupo:**
  * **Corrigido:** regra de entrada do `vetcare-rds-sg` (3306 da EC2 e das Lambdas) e variáveis `AWS_REGION`, `BUCKET_FOTOS` e `RELATORIO_API_URL` no `.env` da EC2.
  * **Corrigido:** o print da landing page aberta pelo arquivo local foi descartado, porque não prova a hospedagem no S3; foi usado o endpoint do site estático.
  * **Aceito:** o teste completo (pet → foto → miniatura → consulta com conflito → encaixe → relatório) e os logs do CloudWatch como evidência do RF-03.
  * **Cuidado de segurança:** um print das variáveis de ambiente da Lambda mostrou a senha do banco; ele **não** foi usado nas evidências nem no vídeo.

---

## Síntese da Sessão 5

| Tipo | Itens |
| :--- | :--- |
| **Aceito** | Roteiro do vídeo; implementação completa de RF-02, RF-03, RF-04, RF-06 e RF-07; Lambdas em Node.js com Jimp; Security Group próprio para as Lambdas |
| **Rejeitado** | Relatório simplificado sem consultas; falas do vídeo em tom robotizado |
| **Corrigido** | `.gitignore` que não protegia o `.env`; falta do filtro por tutor; histórico que não se atualizava; spec ajustada para o registro de encaixe; regra 3306 das Lambdas no `vetcare-rds-sg`; `.env` da EC2 sem as variáveis novas |

---

## Reflexão Final

**O que funcionou.** Trabalhar com a especificação antes do código fez diferença: quando o design mudou (de Lambda para EC2 e de PostgreSQL para MySQL), a spec continuou válida e serviu de checklist para conferir se o código fazia o que prometia. Os critérios de aceite escritos de forma testável viraram roteiro de teste e de demonstração no vídeo.

**Onde a IA ajudou.** A IA acelerou a escrita de documentos, código e comandos, e foi especialmente útil como **revisora**: apontou o loop infinito da Lambda de miniatura, o CRUD incompleto, a senha exposta, o `.gitignore` quebrado e várias incoerências entre spec, design e implementação.

**Onde a IA errou.** A IA também gerou problemas que só apareceram porque o grupo revisou: a senha do banco escrita no código, tabelas criadas pelo próprio servidor em vez de scripts versionados, `ON DELETE CASCADE` contrariando a spec, documentos misturando conteúdo de outros artefatos e incoerências entre arquivos que ela mesma havia escrito. Seguir uma IA passo a passo sem entender cada etapa, como aconteceu na criação da infraestrutura, levou a erros de segurança que custaram tempo para corrigir.

**O que o grupo aprendeu sobre a nuvem.** Na prática, a diferença entre subnet pública e privada está na tabela de rotas; Security Groups que usam outro grupo como origem são mais seguros e sobrevivem à troca de IP; Lambdas dentro da VPC não têm internet e precisam de um Gateway Endpoint para acessar o S3; e no Learner Lab o orçamento é um requisito de arquitetura (sem NAT Gateway, instâncias pequenas e recursos parados ao fim da sessão).

**O que faríamos diferente.** Começaríamos a infraestrutura mais cedo, com todos os integrantes acompanhando, para não concentrar as entregas de 30/10 e 06/11 no fim do prazo. Também revisaríamos cada trecho gerado pela IA antes de executá-lo, principalmente quando envolve credenciais, e manteríamos o `design.md` atualizado a cada mudança, e não só no momento da entrega.

**Conclusão.** A IA escreveu boa parte do projeto, mas as decisões foram do grupo: escolher EC2 para o CRUD, manter o MySQL, aceitar CPF fictício, implementar as consultas e rejeitar o que contrariava a especificação. O resultado é um sistema em que spec, design, código e infraestrutura contam a mesma história.

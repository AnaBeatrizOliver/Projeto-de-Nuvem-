# Tarefas — VetCare

Cada tarefa está ligada a um requisito do [`spec.md`](./spec.md) e a uma decisão do [`design.md`](./design.md).

**Status:** ✅ Concluída · 🔄 Em andamento · ⏳ Pendente

## Entrega 1 — 09/10

| ID | Tarefa | Requisito | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- |
| T-01 | Criar o repositório e dar acesso ao professor | — | Ana Beatriz | ✅ |
| T-02 | Escolher o domínio (clínica veterinária) e escrever o `spec.md` inicial | RF-01 a RF-05 | Ana Beatriz | ✅ |
| T-03 | Primeira entrada no `ia-log.md` | — | Ana Beatriz | ✅ |

## Entrega 2 — 16/10

| ID | Tarefa | Requisito | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- |
| T-04 | Escrever critérios de aceite das histórias | Todos | Ana Beatriz | ✅ |
| T-05 | `design.md`: diagrama, modelo ER, rotas e ADR do RNF-04 | RNF-04 | Ana Beatriz | ✅ |
| T-06 | Publicar a landing page no bucket S3 | RF-05 | Ana Beatriz | ✅ |
| T-07 | Revisar a spec com requisitos do domínio após o feedback do professor | RF-06 a RF-09 | Isaac | ✅ |

## Entrega 3 — 23/10

| ID | Tarefa | Requisito | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- |
| T-08 | Criar a `vetcare-vpc` com subnet pública e privada, sem NAT Gateway | RNF-01 | Nicholas | ✅ |
| T-09 | Criar a EC2 `vetcare-app-server` na subnet pública com o `vetcare-ec2-sg` | RF-01, RNF-04 | Nicholas | ✅ |
| T-10 | Criar o RDS MySQL `vetcare-db` privado (Public access = No) | RF-01, RNF-01 | Nicholas | ✅ |
| T-11 | Configurar o `vetcare-rds-sg` (3306 somente do SG da EC2) | RNF-01 | Nicholas | ✅ |
| T-12 | Trocar a senha do RDS exposta durante a implementação | RNF-02 | Nicholas | ✅ |
| T-13 | Escrever o script `sql/schema.sql` (tabelas e carga inicial) | RF-01 | Isaac | ✅ |
| T-14 | Implementar a API do CRUD de tutores e pets (`server.js`) | RF-01, RF-09 | Isaac | ✅ |
| T-15 | Implementar as telas do CRUD (`public/index.html`) | RF-01, RF-05 | Isaac | ✅ |
| T-16 | Mover as credenciais para o `.env` na EC2 e criar o `.gitignore` | RNF-02 | Isaac | ✅ |
| T-17 | Instalar a aplicação na EC2, executar os scripts SQL e testar o CRUD | RF-01 | Nicholas | ✅ |
| T-18 | Restringir o SSH do `vetcare-ec2-sg` à faixa do EC2 Instance Connect | RNF-01 | Nicholas | ✅ |
| T-19 | Atualizar `design.md` (EC2, MySQL, rede real, Security Groups, ADRs) | RNF-04 | Isaac | ✅ |
| T-20 | Atualizar `README.md` com o passo a passo da infraestrutura | RNF-03, RNF-05 | Isaac | ✅ |
| T-21 | Registrar a sessão de implementação no `ia-log.md` | — | Isaac | ✅ |
| T-22 | Gravar o vídeo de até 5 minutos e enviar no Moodle com o link do repositório | — | Isaac | ✅ |

## Entrega 4 — 30/10 (concluída em 05/11)

| ID | Tarefa | Requisito | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- |
| T-23 | Acrescentar ao `sql/schema.sql` as colunas de foto e a tabela `consultas` | RF-02, RF-06 | Isaac | ✅ |
| T-24 | Criar o bucket de fotos privado com CORS | RF-02 | Isaac | ✅ |
| T-25 | Associar o `LabInstanceProfile` à EC2 | RF-02 | Isaac | ✅ |
| T-26 | Rota de URL pré-assinada e envio da foto pela tela | RF-02 | Isaac | ✅ |
| T-27 | Criar o `vetcare-lambda-sg` e o VPC Gateway Endpoint para o S3 | RF-03, RNF-01 | Isaac | ✅ |
| T-28 | Lambda de miniatura disparada pelo S3, com log no CloudWatch | RF-03 | Isaac | ✅ |
| T-29 | CRUD de consultas com controle de conflito de horário | RF-06 | Isaac | ✅ |
| T-30 | Histórico de consultas do pet | RF-07 | Isaac | ✅ |
| T-31 | Busca de tutores, filtros de pets (espécie, tutor, situação) e paginação nas telas | RF-08 | Isaac | ✅ |
| T-32 | Lambda de relatório exposta pelo API Gateway (JOIN + GROUP BY) | RF-04 | Isaac | ✅ |
| T-33 | Tela de relatório chamando o API Gateway | RF-04, RF-05 | Isaac | ✅ |
| T-34 | Atualizar `design.md` com o que está rodando (diagrama, rotas, SGs, ADR-004 a ADR-006) | — | Isaac | ✅ |
| T-35 | Atualizar `README.md` com o passo a passo de S3, Lambdas, Endpoint e API Gateway | RNF-03, RNF-05 | Isaac | ✅ |
| T-36 | Implantar a nova versão na EC2 e recriar as tabelas `pets` e `consultas` | RF-01 a RF-06 | Isaac | ✅ |

## Entrega final — 06/11

| ID | Tarefa | Requisito | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- |
| T-37 | Prints da aplicação e dos recursos AWS em `docs/evidencias/` | — | Isaac | ✅ |
| T-38 | Reflexão final no `ia-log.md` | — | Isaac | ✅ |
| T-39 | Gerar o ZIP e enviar no Moodle com o link do repositório | — | Isaac | 🔄 |

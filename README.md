# VetCare — Sistema de Gestão para Clínica Veterinária 🐾

Projeto 2 da disciplina de Computação em Nuvem (turma 5J11 · 2026.02). O VetCare centraliza o cadastro de tutores, pets e consultas de uma clínica veterinária e é publicado na AWS (Learner Lab).

🔗 **Protótipo publicado (Amazon S3):** [vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com](http://vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com/)

---

## 1. Onde está cada artefato

| Artefato | Arquivo | Conteúdo |
| :--- | :--- | :--- |
| Especificação | [`specs/spec.md`](./specs/spec.md) | Problema, personas, aplicação dos requisitos ao domínio e histórias de usuário com critérios de aceite |
| Arquitetura e design | [`specs/design.md`](./specs/design.md) | Diagrama de arquitetura, modelo ER, rotas da API, Security Groups e ADRs |
| Tarefas | `specs/tasks.md` | Tarefas com ID, requisito, responsável e status *(a partir da entrega de 23/10)* |
| Registro de uso de IA | [`docs/ia-log.md`](./docs/ia-log.md) | Prompts, o que a IA gerou e o que o grupo aceitou, rejeitou ou corrigiu |
| Scripts SQL | `sql/` | Criação do schema e carga inicial dos veterinários *(a partir da entrega de 23/10)* |
| Front-end | [`src/index.html`](./src/index.html) | Landing page publicada no S3 |

## 2. Estrutura do repositório

```text
.
├── docs/
│   └── ia-log.md              # Registro de uso de IA
├── specs/
│   ├── spec.md                # Especificação
│   ├── design.md              # Arquitetura e design
│   ├── persona-camila.jfif    # Imagem da persona Dra. Camila
│   └── persona-lucas.jfif     # Imagem da persona Lucas
├── src/
│   └── index.html             # Landing page (front-end)
└── README.md
```

## 3. Arquitetura

A arquitetura completa, com diagramas, está no [`design.md`](./specs/design.md). Em resumo:

| Camada | Serviço |
| :--- | :--- |
| Front-end | Amazon S3 (Static Website Hosting) |
| API | Amazon API Gateway (HTTP API) + AWS Lambda (Python 3.12) |
| Banco de dados | Amazon RDS PostgreSQL em subnets privadas, sem acesso público |
| Fotos dos pets | Amazon S3 (bucket privado) + Lambda que gera miniaturas |
| Rede | VPC com subnets públicas e privadas em 2 zonas de disponibilidade, VPC Gateway Endpoint para o S3 e sem NAT Gateway |

---

## 4. Como criar a infraestrutura e publicar o sistema

> Todos os recursos são criados manualmente pelo **Console da AWS** ou pela **AWS CLI no CloudShell**, sem ferramentas de IaC (RNF-05). Nenhuma senha ou chave é gravada neste repositório (RNF-02).

### 4.1 Pré-requisitos

1. Acessar o **AWS Learner Lab** e clicar em **Start Lab**. Aguardar o indicador ficar verde.
2. Clicar em **AWS** para abrir o console.
3. Conferir se a região selecionada é **`us-east-1` (N. Virginia)**. Todos os recursos do projeto ficam nessa região.

### 4.2 Publicar a landing page no S3

**Pelo console:**

1. Abrir o serviço **S3** e clicar em **Create bucket**.
2. Nome: `vetcare-site-projeto-nuvem-2026`. Região: `us-east-1`.
3. Em **Block Public Access settings**, desmarcar **Block all public access** e confirmar o aviso. Clicar em **Create bucket**.
4. No bucket, abrir a aba **Properties** → **Static website hosting** → **Edit** → **Enable**. Em **Index document**, informar `index.html` e salvar.
5. Abrir a aba **Permissions** → **Bucket policy** → **Edit** e colar a política abaixo, que libera apenas a leitura dos arquivos do site:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "LeituraPublicaDoSite",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::vetcare-site-projeto-nuvem-2026/*"
       }
     ]
   }
   ```

6. Abrir a aba **Objects** → **Upload** e enviar o arquivo [`src/index.html`](./src/index.html).
7. Voltar em **Properties** → **Static website hosting** e abrir o endereço indicado em **Bucket website endpoint**.

**Alternativa pela AWS CLI (CloudShell):**

Abrir o **CloudShell** pelo ícone `>_` no topo do console, enviar o `index.html` em **Actions → Upload file**, salvar a política do passo 5 como `politica-site.json` e executar:

```bash
BUCKET=vetcare-site-projeto-nuvem-2026

aws s3 mb s3://$BUCKET --region us-east-1

aws s3api put-public-access-block --bucket $BUCKET \
  --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

aws s3 website s3://$BUCKET --index-document index.html

aws s3api put-bucket-policy --bucket $BUCKET --policy file://politica-site.json

aws s3 cp index.html s3://$BUCKET/index.html
```

**Para atualizar o site:** enviar o novo `index.html` para o mesmo bucket, substituindo o anterior. Se a página continuar igual, recarregar com **Ctrl+F5**.

### 4.3 Retomar o sistema numa nova sessão do Learner Lab (RNF-03)

Os recursos criados continuam na conta entre as sessões. Para o sistema voltar a funcionar:

1. Clicar em **Start Lab** e abrir o console na região **`us-east-1`**.
2. **Front-end:** o site no S3 continua disponível no mesmo endereço; nenhuma ação é necessária.

---

## 5. Cuidados com o orçamento do Learner Lab

Se o orçamento do laboratório for ultrapassado, a conta é desativada e **todos os recursos são apagados**. Ao final de cada sessão de trabalho:

- [ ] Parar a instância do **RDS** (ela **não** é parada automaticamente quando a sessão termina).
- [ ] Parar a **EC2 de administração**, se estiver ligada.
- [ ] Conferir que **nenhum NAT Gateway** foi criado.
- [ ] Lembrar que um RDS parado é **religado automaticamente pela AWS após 7 dias**. Em semanas sem uso, entrar no laboratório e pará-lo novamente.

---

## 6. Equipe

| Nome | RA |
| :--- | :--- |
| Ana Beatriz Pereira de Oliveira | 10444937 |
| Isaac Luiz Koga Carone | 10723323 |
| *(nome do integrante)* | *(RA)* |
| *(nome do integrante)* | *(RA)* |

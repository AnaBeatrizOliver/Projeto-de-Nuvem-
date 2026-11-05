# VetCare — Sistema de Gestão para Clínica Veterinária 🐾

Projeto 2 da disciplina de Computação em Nuvem (turma 5J11 · 2026.02). O VetCare centraliza o cadastro de tutores, pets, fotos e consultas de uma clínica veterinária e é publicado na AWS (Learner Lab).

🔗 **Repositório:** [github.com/AnaBeatrizOliver/Projeto-de-Nuvem-](https://github.com/AnaBeatrizOliver/Projeto-de-Nuvem-)

🔗 **Landing page (Amazon S3):** [vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com](http://vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com/)

🔗 **Aplicação (na EC2):** `http://<IP-público-da-EC2>`. O IP muda a cada nova sessão do Learner Lab; veja a seção 4.13.

---

## 1. Onde está cada artefato

| Artefato | Arquivo | Conteúdo |
| :--- | :--- | :--- |
| Especificação | [`specs/spec.md`](./specs/spec.md) | Problema, personas, aplicação dos requisitos ao domínio e histórias de usuário com critérios de aceite |
| Arquitetura e design | [`specs/design.md`](./specs/design.md) | Diagrama de arquitetura, modelo ER, rotas da API, Security Groups e ADRs |
| Tarefas | [`specs/tasks.md`](./specs/tasks.md) | Tarefas com ID, requisito, responsável e status |
| Registro de uso de IA | [`docs/ia-log.md`](./docs/ia-log.md) | Prompts, o que a IA gerou, o que o grupo aceitou, rejeitou ou corrigiu, e a reflexão final |
| Evidências | [`docs/evidencias/`](./docs/evidencias/) | Prints da aplicação e dos recursos da AWS |
| Script SQL | [`sql/schema.sql`](./sql/schema.sql) | Criação do banco, das tabelas e carga inicial dos veterinários |
| Aplicação (back-end + telas) | [`src/app/`](./src/app/) | `server.js` (API Node.js/Express), `public/index.html` (telas) e `.env.example` |
| Lambda de miniatura (RF-03) | [`lambdas/miniatura/`](./lambdas/miniatura/) | Gera a miniatura da foto e atualiza o RDS |
| Lambda de relatório (RF-04) | [`lambdas/relatorio/`](./lambdas/relatorio/) | Relatório com JOIN e GROUP BY, exposto pelo API Gateway |
| Landing page | [`src/index.html`](./src/index.html) | Página publicada no S3 |

## 2. Estrutura do repositório

```text
.
├── docs/
│   ├── evidencias/            # Prints da aplicação e da AWS
│   └── ia-log.md              # Registro de uso de IA
├── lambdas/
│   ├── miniatura/             # Lambda disparada pelo S3 (index.js + package.json)
│   └── relatorio/             # Lambda do API Gateway (index.js + package.json)
├── specs/
│   ├── spec.md                # Especificação
│   ├── design.md              # Arquitetura e design
│   ├── tasks.md               # Tarefas
│   ├── persona-camila.jfif    # Imagem da persona Dra. Camila
│   └── persona-lucas.jfif     # Imagem da persona Lucas
├── sql/
│   └── schema.sql             # Tabelas + carga inicial dos veterinários
├── src/
│   ├── app/
│   │   ├── server.js          # API (Node.js + Express)
│   │   ├── package.json
│   │   ├── .env.example       # Modelo do arquivo de configuração (sem senha)
│   │   └── public/
│   │       └── index.html     # Telas: tutores, pets, consultas e relatório
│   └── index.html             # Landing page (S3)
├── .gitignore                 # Impede que .env, node_modules e .zip vão para o repositório
└── README.md
```

## 3. Arquitetura

A arquitetura completa, com diagramas, está no [`design.md`](./specs/design.md). Em resumo:

| Camada | Serviço |
| :--- | :--- |
| Landing page | Amazon S3 (Static Website Hosting) |
| Aplicação (API + telas) | Amazon EC2 `t3.micro` (Ubuntu) na subnet pública, com Node.js + Express |
| Banco de dados | Amazon RDS **MySQL** `db.t3.micro` em subnets privadas, sem acesso público |
| Fotos dos pets | Amazon S3 (bucket privado) com upload por URL pré-assinada |
| Miniaturas | AWS Lambda (Node.js 22) disparada pelo S3, dentro da VPC, com log no CloudWatch |
| Relatório | Amazon API Gateway (HTTP API) + AWS Lambda (Node.js 22), dentro da VPC |
| Rede | VPC `vetcare-vpc` com subnet pública (Internet Gateway) e subnets privadas (sem internet), VPC Gateway Endpoint para o S3, sem NAT Gateway |

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

### 4.3 Criar a VPC e as subnets

1. Abrir o serviço **VPC** → **Create VPC** → selecionar **VPC and more**.
2. **Name tag auto-generation:** `vetcare`. **IPv4 CIDR:** `10.0.0.0/16`. **Tenancy:** Default.
3. **Number of Availability Zones:** 1. **Public subnets:** 1. **Private subnets:** 1.
4. **NAT gateways:** **None** (não criar: consome o orçamento). **VPC endpoints:** None.
5. Clicar em **Create VPC**. São criados:

| Recurso | Nome | Configuração |
| :--- | :--- | :--- |
| VPC | `vetcare-vpc` | `10.0.0.0/16` |
| Subnet pública | `vetcare-subnet-public1-us-east-1a` | `10.0.0.0/20` |
| Subnet privada | `vetcare-subnet-private1-us-east-1a` | `10.0.128.0/20` |
| Tabela de rotas pública | `vetcare-rtb-public` | `10.0.0.0/16 → local` · `0.0.0.0/0 → Internet Gateway` |
| Tabela de rotas privada | `vetcare-rtb-private1-us-east-1a` | somente `10.0.0.0/16 → local` |

### 4.4 Criar a EC2 da aplicação

1. Abrir o serviço **EC2** → **Launch instance**.
2. **Name:** `vetcare-app-server`. **AMI:** Ubuntu Server LTS (o projeto usa Ubuntu 26.04 LTS). **Instance type:** `t3.micro`. **Key pair:** `vockey`.
3. Em **Network settings → Edit**: **VPC** `vetcare-vpc`, **Subnet** `vetcare-subnet-public1-us-east-1a`, **Auto-assign public IP** = **Enable**.
4. **Firewall:** criar o security group `vetcare-ec2-sg` com as regras de entrada:
   * **HTTP (80)** de `0.0.0.0/0`: acesso às telas da aplicação.
   * **SSH (22)** de `18.206.107.24/29`: faixa do EC2 Instance Connect em us-east-1, usada para abrir o terminal pelo console.
5. Clicar em **Launch instance**.

### 4.5 Criar o banco RDS MySQL (privado)

1. Abrir o serviço **RDS** → **Create database** → **Full configuration**.
2. **Engine:** MySQL. **Template:** Dev/Test.
3. **DB instance identifier:** `vetcare-db`. **Master username:** `admin`. **Credentials management:** Self managed, com uma senha **anotada fora do repositório**.
4. **Instance class:** Burstable → `db.t3.micro`. **Storage:** gp2, 20 GB. **Multi-AZ:** não.
5. **Connectivity:**
   * **Compute resource:** *Connect to an EC2 compute resource* → `vetcare-app-server`. O RDS cria automaticamente as subnets privadas `RDS-Pvt-subnet-1` a `RDS-Pvt-subnet-5` (sem rota para a internet) e o par de security groups `ec2-rds-1` / `rds-ec2-1`.
   * **VPC:** `vetcare-vpc`. **Public access:** **No**.
   * **VPC security group:** adicionar também o `vetcare-rds-sg`.
6. **Additional configuration:** **Initial database name** `vetcare`; **desmarcar Enhanced Monitoring** (não suportado no Learner Lab).
7. Clicar em **Create database** e aguardar o status **Available** (cerca de 10 minutos).
8. Em **EC2 → Security Groups → vetcare-rds-sg → Edit inbound rules**, deixar apenas: **MySQL/Aurora (3306)** com origem no security group `vetcare-ec2-sg`.

Para obter o endereço do banco (usado nos passos 4.10 e 4.11), executar no **CloudShell**:

```bash
aws rds describe-db-instances --db-instance-identifier vetcare-db \
  --query "DBInstances[0].Endpoint.Address" --output text
```

### 4.6 Criar o bucket das fotos (S3)

1. **S3 → Criar bucket** → nome `vetcare-fotos-5j11-2026` → região `us-east-1` → manter **Bloquear todo o acesso público** marcado → Criar.
2. No bucket → **Permissões → CORS → Editar** → colar e salvar:

   ```json
   [{"AllowedHeaders":["*"],"AllowedMethods":["GET","POST"],"AllowedOrigins":["*"],"ExposeHeaders":[]}]
   ```

### 4.7 Dar acesso ao S3 para a EC2

**EC2 → Instâncias → vetcare-app-server → Ações → Segurança → Modificar função do IAM** → `LabInstanceProfile` → **Atualizar função do IAM**. Com isso o servidor assina as URLs do S3 sem nenhuma chave no código.

### 4.8 Security Group das Lambdas e VPC Gateway Endpoint

1. **EC2 → Grupos de segurança → Criar grupo de segurança** → nome `vetcare-lambda-sg` → VPC `vetcare-vpc` → **sem regras de entrada** → Criar.
2. No **vetcare-rds-sg → Editar regras de entrada → Adicionar regra** → **MySQL/Aurora (3306)** com origem `vetcare-lambda-sg` → Salvar.
3. **VPC → Endpoints → Criar endpoint** → nome `vetcare-s3-endpoint` → **Serviços da AWS** → `com.amazonaws.us-east-1.s3` do tipo **Gateway** → VPC `vetcare-vpc` → tabelas de rotas `RDS-Pvt-rt` e `vetcare-rtb-private1-us-east-1a` → política **Acesso total** → Criar.

### 4.9 Instalar a aplicação na EC2

1. **EC2 → Instâncias → vetcare-app-server → Conectar → EC2 Instance Connect → Conectar.**
2. Instalar o Node.js 22 e o cliente MySQL (somente na primeira vez). A aplicação usa a opção `--env-file`, que exige **Node.js 20 ou superior**:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs git mysql-client
   node -v
   ```

3. Baixar o repositório e copiar a aplicação e o script SQL para `~/vetcare-app`:

   ```bash
   cd ~ && (test -d vetcare-repo && git -C vetcare-repo pull) || git clone https://github.com/AnaBeatrizOliver/Projeto-de-Nuvem-.git ~/vetcare-repo
   mkdir -p ~/vetcare-app
   cp -r ~/vetcare-repo/src/app/. ~/vetcare-app/
   cp -r ~/vetcare-repo/sql ~/vetcare-app/
   cd ~/vetcare-app && npm install
   ```

### 4.10 Configurar a aplicação (arquivo `.env`)

O arquivo `.env` existe **somente na EC2** e está no `.gitignore` (RNF-02).

```bash
cd ~/vetcare-app && nano .env
```

Preencher com base no [`src/app/.env.example`](./src/app/.env.example). Salvar com **Ctrl+O → Enter** e sair com **Ctrl+X**:

```text
DB_HOST=<endpoint do RDS, terminado em .rds.amazonaws.com>
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=<senha do RDS>
DB_NAME=vetcare
PORT=80
AWS_REGION=us-east-1
BUCKET_FOTOS=vetcare-fotos-5j11-2026
RELATORIO_API_URL=<URL de invocação do API Gateway>/relatorios/consultas-por-veterinario
```

Depois, proteger o arquivo: `chmod 600 .env`. O `RELATORIO_API_URL` é preenchido depois do passo 4.12.

### 4.11 Criar as tabelas (script SQL)

```bash
cd ~/vetcare-app
set -a; . ./.env; set +a
export MYSQL_PWD="$DB_PASSWORD"
mysql -h "$DB_HOST" -u "$DB_USER" < sql/schema.sql
mysql -h "$DB_HOST" -u "$DB_USER" vetcare -e "SHOW TABLES; SELECT * FROM veterinarios;"
unset MYSQL_PWD
```

O último comando deve listar as tabelas `consultas`, `pets`, `tutores` e `veterinarios` e os 3 veterinários da carga inicial.

### 4.12 Criar as Lambdas e o API Gateway

**Gerar os pacotes `.zip`** (em qualquer máquina com Node.js, a partir do repositório):

```bash
cd lambdas/miniatura && npm install --omit=dev && zip -r ../vetcare-miniatura.zip index.js package.json node_modules && cd ../..
cd lambdas/relatorio && npm install --omit=dev && zip -r ../vetcare-relatorio.zip index.js package.json node_modules && cd ../..
```

O SDK da AWS (`@aws-sdk/client-s3`) já vem no runtime Node.js 22 da Lambda e não precisa ir no pacote.

**Lambda do relatório:**
1. **Lambda → Criar função → Criar do zero** → nome `vetcare-relatorio` → runtime **Node.js 22.x** → *Permissões*: **Usar uma função existente → LabRole**.
2. *Configurações avançadas*: **Habilitar VPC** → `vetcare-vpc` → sub-redes `RDS-Pvt-subnet-1` e `RDS-Pvt-subnet-2` → grupo de segurança `vetcare-lambda-sg` → Criar.
3. **Código → Fazer upload de → arquivo .zip** → `vetcare-relatorio.zip`.
4. **Configuração → Variáveis de ambiente**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
5. **Configuração → Configuração geral**: memória 256 MB, tempo limite 15 s.

**Lambda da miniatura:**
1. Mesmo procedimento, com nome `vetcare-miniatura`, o pacote `vetcare-miniatura.zip`, as mesmas variáveis, memória **1024 MB** e tempo limite **30 s**.
2. **Adicionar gatilho → S3** → bucket `vetcare-fotos-5j11-2026` → **Todos os eventos de criação de objetos** → **Prefixo `uploads/`** → confirmar o aviso de invocação recursiva → Adicionar. O prefixo garante que as miniaturas (gravadas em `thumbnails/`) não disparem a função de novo.

**API Gateway:**
1. **API Gateway → Criar API → API HTTP → Compilar** → integração **Lambda** `vetcare-relatorio` → nome `vetcare-api`.
2. Rota **GET** `/relatorios/consultas-por-veterinario` → estágio `$default` com implantação automática → Criar.
3. **CORS → Configurar**: Access-Control-Allow-Origin `*`, Allow-Methods `GET` → Salvar.
4. Copiar o **URL de invocação** e completar o `RELATORIO_API_URL` no `.env` da EC2.

### 4.13 Iniciar a aplicação e acessar

```bash
cd ~/vetcare-app
sudo node --env-file=.env server.js
```

O terminal deve mostrar **"Fotos no bucket …"**, **"Relatório configurado"** e **"Conectado ao RDS MySQL em …"**. A aplicação fica disponível em **`http://<IP-público-da-EC2>`** (EC2 → Instâncias → vetcare-app-server → *Endereço IPv4 público*). O servidor fica no ar enquanto esse terminal estiver aberto.

Os logs das Lambdas ficam em **Lambda → (função) → Monitorar → Visualizar logs do CloudWatch**.

### 4.14 Retomar o sistema numa nova sessão do Learner Lab (RNF-03)

Os recursos continuam na conta entre as sessões. Para o sistema voltar a funcionar:

1. Clicar em **Start Lab** e abrir o console na região **`us-east-1`**.
2. **RDS:** se o `vetcare-db` estiver *Interrompido*, selecionar **Ações → Iniciar** e aguardar **Disponível**. O endpoint não muda.
3. **EC2:** a instância é religada automaticamente pelo Learner Lab e recebe um **novo IP público**. Nenhum IP está fixo no código: as telas chamam a API pelo mesmo endereço em que foram abertas (`/api/...`).
4. Conectar na EC2 (EC2 Instance Connect) e executar os comandos do passo 4.13. O `.env` continua salvo na EC2.
5. Acessar `http://<novo-IP-público-da-EC2>`.
6. **Lambdas, API Gateway, buckets e landing page** não dependem da sessão: continuam com os mesmos endereços.

---

## 5. Cuidados com o orçamento do Learner Lab

Se o orçamento do laboratório for ultrapassado, a conta é desativada e **todos os recursos são apagados**. Ao final de cada sessão de trabalho:

- [ ] Parar a instância do **RDS** (ela **não** é parada automaticamente quando a sessão termina).
- [ ] Parar a **EC2 `vetcare-app-server`** (EC2 → Instances → Instance state → Stop).
- [ ] Conferir que **nenhum NAT Gateway** foi criado.
- [ ] Lembrar que um RDS parado é **religado automaticamente pela AWS após 7 dias**. Em semanas sem uso, entrar no laboratório e pará-lo novamente.

---

## 6. Equipe

| Nome | RA |
| :--- | :--- |
| Ana Beatriz Pereira de Oliveira | 10444937 |
| Isaac Luiz Koga Carone | 10723323 |
| Nicholas Lopes Pereira | 10723200 |

# VetCare — Sistema de Gestão para Clínica Veterinária 🐾

Projeto 2 da disciplina de Computação em Nuvem (turma 5J11 · 2026.02). O VetCare centraliza o cadastro de tutores, pets e consultas de uma clínica veterinária e é publicado na AWS (Learner Lab).

🔗 **Landing page (Amazon S3):** [vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com](http://vetcare-site-projeto-nuvem-2026.s3-website-us-east-1.amazonaws.com/)

🔗 **Aplicação (CRUD de tutores e pets, na EC2):** `http://<IP-público-da-EC2>`. O IP muda a cada nova sessão do Learner Lab; veja a seção 4.9.

---

## 1. Onde está cada artefato

| Artefato | Arquivo | Conteúdo |
| :--- | :--- | :--- |
| Especificação | [`specs/spec.md`](./specs/spec.md) | Problema, personas, aplicação dos requisitos ao domínio e histórias de usuário com critérios de aceite |
| Arquitetura e design | [`specs/design.md`](./specs/design.md) | Diagrama de arquitetura, modelo ER, rotas da API, Security Groups e ADRs |
| Tarefas | [`specs/tasks.md`](./specs/tasks.md) | Tarefas com ID, requisito, responsável e status |
| Registro de uso de IA | [`docs/ia-log.md`](./docs/ia-log.md) | Prompts, o que a IA gerou e o que o grupo aceitou, rejeitou ou corrigiu |
| Script SQL | [`sql/schema.sql`](./sql/schema.sql) | Criação do banco, das tabelas e carga inicial dos veterinários |
| Aplicação (back-end + telas) | [`src/app/`](./src/app/) | `server.js` (API Node.js/Express), `public/index.html` (telas do CRUD) e `.env.example` |
| Landing page | [`src/index.html`](./src/index.html) | Página publicada no S3 |

## 2. Estrutura do repositório

```text
.
├── docs/
│   └── ia-log.md              # Registro de uso de IA
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
│   │   ├── server.js          # API do CRUD (Node.js + Express)
│   │   ├── package.json
│   │   ├── .env.example       # Modelo do arquivo de configuração (sem senha)
│   │   └── public/
│   │       └── index.html     # Telas de tutores e pets
│   └── index.html             # Landing page (S3)
├── .gitignore                 # Impede que o .env vá para o repositório
└── README.md
```

## 3. Arquitetura

A arquitetura completa, com diagramas, está no [`design.md`](./specs/design.md). Em resumo:

| Camada | Serviço |
| :--- | :--- |
| Landing page | Amazon S3 (Static Website Hosting) |
| Aplicação (API + telas do CRUD) | Amazon EC2 `t3.micro` (Ubuntu) na subnet pública, com Node.js + Express |
| Banco de dados | Amazon RDS **MySQL** `db.t3.micro` em subnets privadas, sem acesso público |
| Fotos e relatório *(entrega de 30/10)* | Amazon S3 (bucket privado) + AWS Lambda; relatório via API Gateway + Lambda |
| Rede | VPC `vetcare-vpc` com subnet pública (rota para o Internet Gateway) e subnets privadas (sem rota para a internet), sem NAT Gateway |

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
2. **Name:** `vetcare-app-server`. **AMI:** Ubuntu Server 24.04 LTS. **Instance type:** `t3.micro`. **Key pair:** `vockey`.
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

Para obter o endereço do banco (usado no passo 4.7), executar no **CloudShell**:

```bash
aws rds describe-db-instances --db-instance-identifier vetcare-db \
  --query "DBInstances[0].Endpoint.Address" --output text
```

### 4.6 Instalar a aplicação na EC2

1. **EC2 → Instances → vetcare-app-server → Connect → EC2 Instance Connect → Connect.**
2. Instalar o Node.js 22 (somente na primeira vez). A aplicação usa a opção `--env-file`, que exige **Node.js 20 ou superior**; o pacote padrão do Ubuntu pode instalar uma versão mais antiga:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node -v
   ```

   O último comando deve mostrar `v22.x.x`.

3. Baixar o repositório e copiar a aplicação e o script SQL para a pasta `~/vetcare-app`:

   ```bash
   sudo apt-get install -y git mysql-client
   git clone <URL-do-repositório-no-GitHub> ~/vetcare-repo
   mkdir -p ~/vetcare-app
   cp -r ~/vetcare-repo/src/app/. ~/vetcare-app/
   cp -r ~/vetcare-repo/sql ~/vetcare-app/
   cd ~/vetcare-app && npm install
   ```

   Se o repositório for privado, o `git clone` pede o usuário do GitHub e um *personal access token* no lugar da senha.

### 4.7 Configurar o acesso ao banco (arquivo `.env`)

O arquivo `.env` existe **somente na EC2** e está no `.gitignore` (RNF-02).

```bash
cd ~/vetcare-app && nano .env
```

Preencher com base no [`src/app/.env.example`](./src/app/.env.example), trocando o endereço e a senha. Salvar com **Ctrl+O → Enter** e sair com **Ctrl+X**:

```text
DB_HOST=<endpoint do RDS, terminado em .rds.amazonaws.com>
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=<senha do RDS>
DB_NAME=vetcare
PORT=80
```

Depois, proteger o arquivo: `chmod 600 .env`.

### 4.8 Criar as tabelas (scripts SQL)

```bash
cd ~/vetcare-app
set -a; . ./.env; set +a
export MYSQL_PWD="$DB_PASSWORD"
mysql -h "$DB_HOST" -u "$DB_USER" < sql/schema.sql
mysql -h "$DB_HOST" -u "$DB_USER" vetcare -e "SHOW TABLES; SELECT * FROM veterinarios;"
unset MYSQL_PWD
```

O último comando deve listar as tabelas `pets`, `tutores` e `veterinarios` e os 3 veterinários da carga inicial.

### 4.9 Iniciar a aplicação e acessar

```bash
cd ~/vetcare-app
sudo node --env-file=.env server.js
```

O terminal deve mostrar **"Conectado ao RDS MySQL em …"**. A aplicação fica disponível em **`http://<IP-público-da-EC2>`** (EC2 → Instances → vetcare-app-server → *Public IPv4 address*). O selo no topo da tela indica **"Conectado ao Amazon RDS"**. O servidor fica no ar enquanto esse terminal estiver aberto.

### 4.10 Retomar o sistema numa nova sessão do Learner Lab (RNF-03)

Os recursos continuam na conta entre as sessões. Para o sistema voltar a funcionar:

1. Clicar em **Start Lab** e abrir o console na região **`us-east-1`**.
2. **RDS:** se o `vetcare-db` estiver *Stopped*, selecionar **Actions → Start** e aguardar **Available**. O endpoint não muda.
3. **EC2:** a instância é religada automaticamente pelo Learner Lab e recebe um **novo IP público**. Nenhum IP está fixo no código: as telas chamam a API pelo mesmo endereço em que foram abertas (`/api/...`).
4. Conectar na EC2 (EC2 Instance Connect) e executar os comandos do passo 4.9. O `.env` continua salvo na EC2.
5. Acessar `http://<novo-IP-público-da-EC2>`.
6. **Landing page:** continua disponível no mesmo endereço do S3.

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
| *(nome do integrante)* | *(RA)* |
| *(nome do integrante)* | *(RA)* |
| *(nome do integrante)* | *(RA)* |

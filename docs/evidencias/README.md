# Evidências — VetCare

Prints da aplicação funcionando e dos recursos criados na AWS (Learner Lab, região `us-east-1`). Nenhum print mostra senhas, chaves ou tokens.

| # | Arquivo | O que mostra | Requisito |
| :--- | :--- | :--- | :--- |
| 01 | `01-vpc-mapa-de-recursos.png` | VPC `vetcare-vpc` → Mapa de recursos (subnets, tabelas de rotas, Internet Gateway) | RNF-01 |
| 02 | `02-rotas-publica.png` | Tabela `vetcare-rtb-public` → rota `0.0.0.0/0` para o Internet Gateway | RNF-01 |
| 03 | `03-rotas-privada.png` | Tabela `RDS-Pvt-rt` → rota `local` e rota do S3 pelo Gateway Endpoint | RNF-01, RF-03 |
| 04 | `04-vpc-endpoint-s3.png` | Endpoint `vetcare-s3-endpoint` (tipo Gateway) | RF-03 |
| 05 | `05-rds-conectividade.png` | RDS `vetcare-db` → Conectividade e segurança (VPC, subnets, **Acessível publicamente: Não**) | RNF-01 |
| 06 | `06-sg-ec2.png` | `vetcare-ec2-sg` → Regras de entrada | RNF-01 |
| 07 | `07-sg-rds.png` | `vetcare-rds-sg` → Regras de entrada (3306 apenas da EC2 e das Lambdas) | RNF-01 |
| 08 | `08-ec2-instancia.png` | EC2 `vetcare-app-server` em execução, com o `LabInstanceProfile` | RF-01, RF-02 |
| 09 | `09-tabelas-banco.png` | Terminal da EC2 com `SHOW TABLES` / `DESCRIBE` | RF-01 |
| 10 | `10-tela-tutores.png` | Tela de tutores com cadastro e CPF mascarado | RF-01, RF-05 |
| 11 | `11-tela-pets-com-foto.png` | Tela de pets com a miniatura da foto | RF-01, RF-02, RF-03 |
| 12 | `12-bucket-fotos.png` | Bucket `vetcare-fotos-5j11-2026` com as pastas `uploads/` e `thumbnails/` | RF-02, RF-03 |
| 13 | `13-lambda-miniatura-gatilho.png` | Lambda `vetcare-miniatura` com o gatilho do S3 (prefixo `uploads/`) | RF-03 |
| 14 | `14-cloudwatch-miniatura.png` | Log da Lambda de miniatura no CloudWatch (início, fim) | RF-03 |
| 15 | `15-tela-consultas.png` | Agenda de consultas e mensagem de conflito de horário | RF-06 |
| 16 | `16-tela-historico.png` | Histórico de consultas de um pet | RF-07 |
| 17 | `17-api-gateway-rota.png` | API Gateway `vetcare-api` com a rota `GET /relatorios/consultas-por-veterinario` | RF-04 |
| 18 | `18-tela-relatorio.png` | Tela de relatório com o resultado | RF-04 |
| 19 | `19-persistencia-select.png` | Terminal da EC2 com `SELECT` mostrando os dados gravados no RDS | RF-01 |
| 20 | `20-landing-page.png` | Landing page no S3 | RF-05 |

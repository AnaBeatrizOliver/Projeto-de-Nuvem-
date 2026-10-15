# Especificação do Projeto: Sistema de Gestão para Clínica Veterinária (VetCare)

## 1. Visão Geral e Problema
A clínica veterinária **VetCare** enfrenta dificuldades na organização centralizada dos cadastros de clientes (tutores), animais (pets) e médicos veterinários responsáveis. Atualmente, o fluxo de agendamentos e registros de histórico é descentralizado, o que dificulta o acompanhamento contínuo dos pacientes. Além disso, a gestão visual das fotos dos animais e a emissão de relatórios consolidados sobre a população de pacientes atendidos exigem um processo automatizado, escalável e seguro na nuvem.

O objetivo deste projeto é construir uma aplicação web robusta, hospedada na infraestrutura da **AWS (Learner Lab)**, integrando microsserviços e persistência em banco de dados relacional para otimizar o atendimento operacional da clínica.

---

## 2. Personas

### Persona 1: Dra. Camila Rocha (Veterinária Chefe)
![Dra. Camila Rocha](persona-camila.jfif)
* **Perfil:** 38 anos, médica veterinária atuante e sócia da clínica.
* **Necessidades:** Visualizar rapidamente quais pets estão sob sua responsabilidade, acessar fotos atualizadas dos animais e acompanhar relatórios consolidados por espécie/atendimento.
* **Dores:** Dificuldade em consultar rapidamente os dados do pet durante o atendimento e falta de relatórios agregados de desempenho e atendimentos da clínica.

### Persona 2: Lucas Mendes (Recepcionista/Atendente)
![Lucas Mendes](persona-lucas.jfif)
* **Perfil:** 24 anos, encarregado da recepção e agendamentos.
* **Necessidades:** Cadastrar e atualizar tutores e seus respetivos pets de forma rápida, além de vincular a foto do animal de estimação diretamente no perfil do pet.
* **Dores:** Perda de tempo com formulários complexos e lentidão para atualizar informações dos animais dos clientes.

---

## 3. Aplicação dos Requisitos Funcionais e Não-Funcionais
## 3. Aplicação dos Requisitos no Domínio

| ID | Requisito no Projeto |
| :--- | :--- |
| **RF-01** | CRUD de `Tutores` e `Pets` (relacionamento 1:N), vinculados a um `Veterinario`, persistidos no **Amazon RDS**. |
| **RF-02** | Upload da foto do pet diretamente para o **Amazon S3** via **URL pré-assinada** gerada pelo backend. |
| **RF-03** | Upload da foto no S3 dispara uma **Lambda** que gera uma miniatura (*thumbnail*) e atualiza a URL no **RDS**. |
| **RF-04** | Endpoint de relatório (`GET /relatorios/...`) exposto no **API Gateway** + **Lambda**, consultando o banco com `JOIN` e `GROUP BY`. |
| **RF-05** | Front-end web publicado consumindo a API. |
| **RNF-01** | RDS em subnet privada, sem acesso público e protegido por Security Groups. |
| **RNF-02** | Nenhuma senha, chave ou token no repositório Git. |
| **RNF-03** | Aplicação resiliente a mudanças de IP da EC2 após reinício da sessão no Learner Lab. |
---

## 4. Histórias de Usuário (User Stories) e Critérios de Aceite

### US-01: Cadastro e Gestão de Tutores
* **Como** Lucas (Recepcionista),
* **Quero** cadastrar, listar, atualizar e remover os dados do Tutor (Nome, CPF, Telefone, E-mail),
* **Para** manter a base de contatos dos clientes da clínica sempre atualizada.
* **Critérios de Aceite:**
  1. O sistema deve validar e impedir o cadastro de tutores sem nome ou telefone válidos.
  2. Todas as alterações e remoções devem refletir instantaneamente na base RDS.
  3. A remoção de um tutor só pode ocorrer se tratada a integridade referente aos pets associados.

### US-02: Associação e Gestão de Pets por Tutor
* **Como** Lucas (Recepcionista),
* **Quero** vincular um ou mais Pets a um Tutor já cadastrado, definindo a espécie, raça, idade e o médico veterinário responsável,
* **Para** organizar o histórico de pacientes de cada cliente.
* **Critérios de Aceite:**
  1. Cada Pet deve obrigatoriamente possuir vínculo com exatamente 1 Tutor (`tutor_id`).
  2. O sistema deve permitir listar todos os pets associados a um determinado tutor.
  3. Deve ser possível selecionar o veterinário responsável pelo pet no momento do cadastro/edição.

### US-03: Upload de Foto do Pet via S3
* **Como** Lucas (Recepcionista) ou Dra. Camila (Veterinária),
* **Quero** anexar uma foto do perfil do Pet enviando a imagem com segurança para a nuvem,
* **Para** facilitar o reconhecimento visual do animal durante as consultas.
* **Critérios de Aceite:**
  1. O backend deve gerar e retornar uma URL pré-assinada do Amazon S3 válida por tempo limitado.
  2. O upload deve ser realizado diretamente do cliente (front-end) para o bucket S3 sem passar o payload pesado pelo backend.

### US-04: Processamento Automático de Miniatura da Foto
* **Como** Sistema / Dra. Camila (Veterinária),
* **Quero** que o envio de uma nova foto gere automaticamente uma versão em miniatura (*thumbnail*),
* **Para** otimizar o carregamento das fotos na listagem do sistema.
* **Critérios de Aceite:**
  1. O evento `s3:ObjectCreated:*` deve disparar automaticamente uma função AWS Lambda.
  2. A Lambda deve processar a imagem, salvar a miniatura no bucket e gravar o novo caminho/URL no registro do Pet correspondente no RDS.

### US-05: Relatório de Atendimentos por Veterinário e Espécie
* **Como** Dra. Camila (Veterinária Chefe),
* **Quero** acessar um relatório consolidado com o quantitativo de pets agrupados por espécie e por veterinário responsável,
* **Para** acompanhar a distribuição da demanda médica dentro da clínica.
* **Critérios de Aceite:**
  1. O endpoint deve executar uma consulta SQL contendo obrigatoriamente `JOIN` (entre as tabelas `pets`, `tutores` e `veterinarios`) e `GROUP BY`.
  2. A resposta deve ser retornada em formato JSON estruturado através do API Gateway + Lambda.

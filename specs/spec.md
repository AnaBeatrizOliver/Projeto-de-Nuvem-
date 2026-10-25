# Especificação do Projeto: Sistema de Gestão para Clínica Veterinária (VetCare)

---

## 1. Problema

A clínica veterinária **VetCare** mantém os dados de tutores, pets e consultas espalhados em planilhas e anotações em papel. Isso causa três problemas no dia a dia:

1. **Recepção lenta:** para atender um cliente, o recepcionista precisa procurar o tutor e o pet em mais de um lugar, e cadastros duplicados são comuns.
2. **Agenda sem controle:** não há como saber, de forma confiável, se um veterinário já tem consulta marcada em determinado horário, o que gera conflitos de agenda.
3. **Falta de informação para a gestão:** a veterinária chefe não consegue ver o histórico de atendimentos de um animal durante a consulta nem acompanhar quantas consultas cada veterinário realiza, por espécie.

O VetCare é uma aplicação web, publicada na AWS, que centraliza tutores, pets e consultas em um único banco de dados, permitindo encontrar um cliente em poucos passos, agendar sem conflito de horário, consultar o histórico de cada pet, anexar fotos dos animais e emitir um relatório de atendimentos.

---

## 2. Personas

### Persona 1: Dra. Camila Rocha (Veterinária Chefe)
![Dra. Camila Rocha](persona-camila.jfif)
* **Perfil:** 38 anos, médica veterinária e sócia da clínica.
* **Necessidades:** ver rapidamente os dados, a foto e o histórico de consultas do pet durante o atendimento; acompanhar quantas consultas cada veterinário realiza, por espécie.
* **Dores:** perde tempo procurando o histórico do animal em anotações antigas e não tem nenhum relatório consolidado da clínica.

### Persona 2: Lucas Mendes (Recepcionista)
![Lucas Mendes](persona-lucas.jfif)
* **Perfil:** 24 anos, responsável pela recepção, pelos cadastros e pela agenda.
* **Necessidades:** encontrar um tutor pelo CPF ou nome, cadastrar e atualizar tutores e pets rapidamente e marcar consultas sabendo que o horário está livre.
* **Dores:** formulários longos, cadastros duplicados e conflitos de agenda descobertos só quando o cliente chega.

---

## 3. Como os Requisitos se Aplicam ao Domínio

### 3.1 Requisitos funcionais

| ID | Requisito do enunciado | Aplicação no VetCare | Histórias |
| :--- | :--- | :--- | :--- |
| **RF-01** | CRUD de 2 entidades relacionadas no RDS | CRUD completo de **Tutores** e **Pets** (1 tutor : N pets). Cada pet também é vinculado a um **veterinário responsável**; os veterinários são cadastrados por carga inicial no banco e apenas listados no sistema | US-01, US-02 |
| **RF-02** | Upload de arquivo para o S3 via URL pré-assinada | **Foto do pet** enviada pelo navegador diretamente para o S3, usando uma URL pré-assinada gerada pelo backend | US-04 |
| **RF-03** | Evento S3 → Lambda → RDS | Cada nova foto dispara uma Lambda que gera a **miniatura** da imagem e grava o endereço dela no cadastro do pet | US-05 |
| **RF-04** | Relatório via API Gateway + Lambda com JOIN/GROUP BY | **Consultas realizadas por veterinário e espécie** em um período | US-08 |
| **RF-05** | Front-end web publicado consumindo a API | Interface web com as telas de tutores, pets, consultas e relatório | US-09 |
| **RF-06** | Consultas | Agendar, remarcar, cancelar e registrar o atendimento de consultas (pet + veterinário + data/hora + motivo + observações + status), sem conflito de horário. Cria uma relação **N:N entre pets e veterinários** por meio das consultas | US-06 |
| **RF-07** | Histórico do pet | Listar todas as consultas de um pet, da mais recente para a mais antiga | US-07 |
| **RF-08** | Busca e filtros | Buscar tutores por nome ou CPF e filtrar pets por espécie, tutor e situação | US-03 |
| **RF-09** | Inativação de pet | Marcar um pet como inativo (óbito ou transferência) sem apagar seus dados e seu histórico, com possibilidade de reativação | US-02 |

### 3.2 Requisitos não funcionais

| ID | Requisito | Aplicação no VetCare | Histórias |
| :--- | :--- | :--- | :--- |
| **RNF-01** | RDS em subnet privada, sem acesso público, com Security Groups documentados | Os dados de tutores, pets e consultas ficam em um banco de dados **sem acesso pela internet**, acessível apenas pelo backend do sistema | US-01, US-02 |
| **RNF-02** | Nenhuma senha ou chave no repositório | Nenhuma senha do banco ou chave de acesso da AWS é armazenada no repositório do projeto | Todas |
| **RNF-03** | Funcionar numa nova sessão do Learner Lab sem IP fixo | O sistema volta a funcionar numa nova sessão do Learner Lab seguindo apenas o `README.md`, sem endereços IP fixos no código | US-09 |
| **RNF-04** | Decisão justificada (ADR): CRUD em Lambda ou container | A forma de execução do CRUD de tutores e pets é escolhida e justificada em um ADR no `design.md` | US-01, US-02 |
| **RNF-05** | Sem IaC (CloudFormation/Terraform/SAM) | Todos os recursos da AWS são criados pelo console ou pela CLI e documentados passo a passo no `README.md` | Todas |
| **RNF-06** | Proteção de dados pessoais (LGPD) — específico do domínio | CPF e telefone dos tutores são dados pessoais: nas listagens o CPF aparece mascarado e esses dados não são registrados em logs | US-01 |

---

## 4. Histórias de Usuário e Critérios de Aceite

**Regras gerais (valem para todas as histórias):**
* Antes de qualquer exclusão, o sistema pede confirmação.
* Quando há erro, nada é salvo e a tela mostra uma mensagem clara indicando o problema.
* Ao abrir, editar ou excluir um registro que não existe, o sistema informa que ele não foi encontrado.

### US-01: Gerenciar tutores
**Requisitos:** RF-01, RNF-06

* **Como** Lucas (recepcionista),
* **Quero** cadastrar, consultar, editar e excluir tutores (nome, CPF, telefone e e-mail),
* **Para** manter a base de clientes da clínica correta e sem duplicidade.

**Critérios de aceite:**
1. O cadastro exige nome (3 a 100 caracteres), CPF com 11 dígitos e telefone com 10 ou 11 dígitos. Por se tratar de um projeto acadêmico, CPFs fictícios são aceitos (não há cálculo dos dígitos verificadores). O e-mail é opcional, mas, se informado, precisa ser válido. A mensagem de erro indica qual campo está incorreto.
2. O CPF não pode se repetir, no cadastro ou na edição, mesmo digitado com ou sem pontuação (mensagem: "CPF já cadastrado").
3. As alterações feitas na edição ficam gravadas.
4. A listagem aparece em ordem alfabética, com o CPF mascarado (`***.456.789-**`); o CPF completo aparece apenas na tela de detalhe.
5. Um tutor com pets cadastrados (ativos ou inativos) não pode ser excluído (mensagem: "Tutor possui pets cadastrados"). Sem pets, ele é excluído.

### US-02: Gerenciar pets
**Requisitos:** RF-01, RF-09

* **Como** Lucas (recepcionista),
* **Quero** cadastrar, consultar, editar, inativar e excluir os pets de um tutor, escolhendo o veterinário responsável,
* **Para** manter organizado o cadastro de pacientes de cada cliente.

**Critérios de aceite:**
1. O cadastro exige um tutor existente, nome, espécie (Cão, Gato, Ave, Roedor, Réptil ou Outro) e veterinário responsável, escolhido em uma lista carregada do sistema. Raça, data de nascimento e peso são opcionais.
2. Não são aceitos data de nascimento futura nem peso menor ou igual a zero.
3. Na edição, é possível alterar todos os dados, inclusive o veterinário responsável.
4. Na tela do tutor aparecem todos os seus pets, com os inativos identificados pelo selo "Inativo". A listagem geral, sem filtros, mostra apenas os pets ativos.
5. Ao inativar um pet, seus dados e seu histórico são mantidos, e as consultas futuras dele são canceladas automaticamente, informando quantas foram canceladas. Um pet inativo pode ser reativado.
6. Um pet com consultas não pode ser excluído (mensagem: "Pet possui consultas; utilize a inativação"). Sem consultas, ele é excluído.

### US-03: Buscar tutores e pets
**Requisito:** RF-08

* **Como** Lucas (recepcionista),
* **Quero** encontrar um tutor pelo nome ou CPF e filtrar pets por espécie, tutor ou situação,
* **Para** atender o cliente no balcão sem procurar em listas longas.

**Critérios de aceite:**
1. A busca de tutores aceita um trecho do nome, sem diferenciar maiúsculas, minúsculas e acentos ("jose" encontra "José"), ou o CPF, com ou sem pontuação.
2. Com o campo de busca vazio, aparece a listagem normal; sem resultados, aparece "Nenhum tutor encontrado".
3. Os pets podem ser filtrados por espécie, tutor e situação (ativo/inativo), e os filtros podem ser combinados.
4. As listagens de tutores e pets são exibidas em páginas de 20 itens, com o total de registros.

### US-04: Enviar a foto do pet
**Requisito:** RF-02

* **Como** Lucas (recepcionista),
* **Quero** anexar a foto do pet no cadastro dele,
* **Para** que a equipe reconheça o animal facilmente durante o atendimento.

**Critérios de aceite:**
1. São aceitos apenas arquivos JPG ou PNG de até 5 MB; outros arquivos são bloqueados com uma mensagem.
2. A foto vai direto do navegador para o S3, usando uma URL pré-assinada gerada pelo backend e válida por 5 minutos. Se a URL expirar, a tela orienta o usuário a tentar novamente.
3. Uma nova foto substitui a anterior. Um pet sem foto aparece com uma imagem padrão.

### US-05: Gerar a miniatura da foto automaticamente
**Requisito:** RF-03

* **Como** Dra. Camila (veterinária chefe),
* **Quero** que as listagens mostrem miniaturas leves das fotos dos pets,
* **Para** que as telas carreguem rápido mesmo com muitos pacientes.

**Critérios de aceite:**
1. Cada nova foto dispara automaticamente uma Lambda, que gera a miniatura (150x150 px, mantendo a proporção) e grava a foto e a miniatura no cadastro do pet.
2. A miniatura gerada não dispara um novo processamento, evitando execuções em loop.
3. Enquanto a miniatura não fica pronta, o pet exibe o indicador "processando".
4. Se o arquivo estiver corrompido, a foto anterior é mantida e o pet exibe "erro no processamento da foto". Se o arquivo não pertencer a um pet existente, nenhum cadastro é alterado.
5. Todo processamento fica registrado no log do CloudWatch, com início, fim e resultado.

### US-06: Agendar e registrar consultas
**Requisito:** RF-06

* **Como** Lucas (recepcionista) e Dra. Camila (veterinária),
* **Quero** agendar consultas para os pets e, depois do atendimento, registrar o resultado,
* **Para** organizar a agenda dos veterinários e manter o histórico dos pacientes.

**Regras da agenda:** cada consulta dura **30 minutos**; a clínica atende de **segunda a sábado, das 8h às 18h**; a consulta pode ser feita com um veterinário diferente do responsável pelo pet (plantão ou especialista).

**Critérios de aceite:**
1. O agendamento exige um pet ativo, um veterinário, um motivo e uma data/hora futura dentro do horário de funcionamento. A consulta é criada com o status "agendada".
2. Não pode haver consultas sobrepostas (desconsiderando as canceladas) nem para o mesmo veterinário ("Veterinário já possui consulta neste horário") nem para o mesmo pet ("Pet já possui consulta neste horário"). Horários que apenas se encostam, como 10:00–10:30 e 10:30, são permitidos.
3. Se dois agendamentos para o mesmo horário forem enviados ao mesmo tempo, apenas um é aceito.
4. Remarcar uma consulta segue as mesmas regras, sem considerar conflito com ela mesma.
5. Uma consulta "agendada" pode virar "realizada" (somente depois do horário marcado, com as observações do atendimento) ou "cancelada" (o horário fica livre). Consultas realizadas ou canceladas não podem mais ser alteradas.
6. A agenda mostra as consultas de um veterinário em um dia, em ordem de horário.

### US-07: Consultar o histórico do pet
**Requisito:** RF-07

* **Como** Dra. Camila (veterinária chefe),
* **Quero** ver todas as consultas de um pet durante o atendimento,
* **Para** conhecer o histórico do animal sem procurar em anotações antigas.

**Critérios de aceite:**
1. O histórico mostra as consultas da mais recente para a mais antiga, com data, veterinário, motivo, status e observações, e pode ser filtrado por status.
2. Um pet sem consultas exibe "Nenhuma consulta registrada".
3. O histórico continua disponível para pets inativos.

### US-08: Emitir o relatório de consultas por veterinário e espécie
**Requisito:** RF-04

* **Como** Dra. Camila (veterinária chefe),
* **Quero** ver quantas consultas cada veterinário realizou, separadas pela espécie do animal, em um período,
* **Para** acompanhar a distribuição da demanda e planejar a escala da equipe.

**Critérios de aceite:**
1. O relatório mostra, para cada veterinário e espécie, a quantidade de consultas **realizadas** no período escolhido. Sem período informado, considera os últimos 30 dias. Exemplo:

   | Veterinário | Espécie | Consultas realizadas |
   | :--- | :--- | :--- |
   | Dra. Camila Rocha | Cão | 12 |
   | Dra. Camila Rocha | Gato | 5 |

2. Uma data inicial maior que a final é recusada com mensagem de erro.
3. Um período sem consultas realizadas exibe "Nenhuma consulta no período".

### US-09: Usar o sistema pelo navegador
**Requisito:** RF-05

* **Como** Lucas (recepcionista),
* **Quero** acessar o sistema pelo navegador, sem instalar nada,
* **Para** usar qualquer computador da recepção.

**Critérios de aceite:**
1. Pelo endereço público do site, é possível acessar as telas de tutores, pets, consultas e relatório.
2. Durante as operações, a tela mostra um indicador de carregamento. Se o servidor estiver fora do ar, aparece "Não foi possível conectar ao servidor. Tente novamente."
3. Numa nova sessão do Learner Lab, o site volta a funcionar seguindo o `README.md`, sem alterar endereços dentro do código das telas.

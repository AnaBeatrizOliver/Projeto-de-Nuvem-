// VetCare - API do CRUD de tutores e pets (RF-01)
// Executa na EC2 (subnet pública) e acessa o RDS MySQL (subnet privada).
// As credenciais do banco vêm de variáveis de ambiente, lidas do arquivo .env
// que existe somente na EC2 e nunca vai para o repositório (RNF-02).
// Iniciar com:  sudo node --env-file=.env server.js

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------
const obrigatorias = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const faltando = obrigatorias.filter((nome) => !process.env[nome]);
if (faltando.length > 0) {
  console.error(`Variáveis de ambiente ausentes: ${faltando.join(', ')}`);
  console.error('Crie o arquivo .env (veja .env.example) e inicie com: sudo node --env-file=.env server.js');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true,
});

const PORTA = Number(process.env.PORT || 80);
const ESPECIES = ['Cão', 'Gato', 'Ave', 'Roedor', 'Réptil', 'Outro'];

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log de cada requisição sem dados pessoais (RNF-06): só método, caminho e status
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} -> ${res.statusCode}`);
  });
  next();
});

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------
const somenteDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');
const idValido = (valor) => Number.isInteger(valor) && valor > 0;
const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

const mascararCpf = (cpf) => `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;

function erro(res, status, mensagem) {
  return res.status(status).json({ erro: mensagem });
}

function tratarErroBanco(e, res) {
  switch (e.code) {
    case 'ER_DUP_ENTRY':
      return erro(res, 409, 'CPF já cadastrado');
    case 'ER_ROW_IS_REFERENCED_2':
      return erro(res, 409, 'Registro possui vínculos e não pode ser excluído');
    case 'ER_NO_REFERENCED_ROW_2':
      return erro(res, 400, 'Tutor ou veterinário informado não existe');
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      return erro(res, 400, 'Dados inválidos');
    default:
      console.error('Erro inesperado:', e.code || e.message);
      return erro(res, 500, 'Erro interno no servidor');
  }
}

// Envolve cada rota para que qualquer erro do banco vire uma resposta JSON
const rota = (fn) => (req, res) => fn(req, res).catch((e) => tratarErroBanco(e, res));

function validarTutor(corpo) {
  const nome = String(corpo.nome ?? '').trim();
  const cpf = somenteDigitos(corpo.cpf);
  const telefone = somenteDigitos(corpo.telefone);
  const email = String(corpo.email ?? '').trim();

  if (nome.length < 3 || nome.length > 100) return { erro: 'Nome deve ter entre 3 e 100 caracteres' };
  // CPF fictício é aceito: basta ter 11 dígitos (sem cálculo dos dígitos verificadores)
  if (!/^\d{11}$/.test(cpf)) return { erro: 'CPF deve ter 11 dígitos' };
  if (!/^\d{10,11}$/.test(telefone)) return { erro: 'Telefone deve ter 10 ou 11 dígitos' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: 'E-mail inválido' };

  return { dados: { nome, cpf, telefone, email: email || null } };
}

function validarPet(corpo) {
  const nome = String(corpo.nome ?? '').trim();
  const especie = String(corpo.especie ?? '');
  const tutorId = Number(corpo.tutor_id);
  const veterinarioId = Number(corpo.veterinario_id);
  const raca = String(corpo.raca ?? '').trim() || null;
  const dataNascimento = corpo.data_nascimento ? String(corpo.data_nascimento) : null;
  const peso = corpo.peso === '' || corpo.peso == null ? null : Number(corpo.peso);

  if (!nome || nome.length > 50) return { erro: 'Nome do pet é obrigatório (até 50 caracteres)' };
  if (!ESPECIES.includes(especie)) return { erro: `Espécie deve ser: ${ESPECIES.join(', ')}` };
  if (!idValido(tutorId)) return { erro: 'Selecione o tutor' };
  if (!idValido(veterinarioId)) return { erro: 'Selecione o veterinário responsável' };
  if (dataNascimento) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento) || Number.isNaN(Date.parse(dataNascimento))) {
      return { erro: 'Data de nascimento inválida' };
    }
    if (dataNascimento > hoje()) return { erro: 'Data de nascimento não pode ser futura' };
  }
  if (peso !== null && (!Number.isFinite(peso) || peso <= 0 || peso >= 1000)) {
    return { erro: 'Peso deve ser maior que zero' };
  }

  return {
    dados: { nome, especie, tutor_id: tutorId, veterinario_id: veterinarioId, raca, data_nascimento: dataNascimento, peso },
  };
}

const SELECT_PET = `
  SELECT p.id, p.nome, p.especie, p.raca, p.data_nascimento, p.peso, p.ativo,
         p.tutor_id, t.nome AS tutor_nome,
         p.veterinario_id, v.nome AS veterinario_nome
    FROM pets p
    JOIN tutores t      ON t.id = p.tutor_id
    JOIN veterinarios v ON v.id = p.veterinario_id`;

const formatarPet = (linha) => ({
  ...linha,
  ativo: Boolean(linha.ativo),
  peso: linha.peso === null ? null : Number(linha.peso),
});

// ---------------------------------------------------------------------------
// Saúde da aplicação (usada pela tela para mostrar "Conectado ao RDS")
// ---------------------------------------------------------------------------
app.get('/api/health', rota(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', banco: 'conectado' });
}));

// ---------------------------------------------------------------------------
// Veterinários (somente leitura; carga inicial no final de sql/schema.sql)
// ---------------------------------------------------------------------------
app.get('/api/veterinarios', rota(async (req, res) => {
  const [linhas] = await pool.query('SELECT id, nome, crmv, especialidade FROM veterinarios ORDER BY nome');
  res.json(linhas);
}));

// ---------------------------------------------------------------------------
// Tutores - CRUD
// ---------------------------------------------------------------------------
app.get('/api/tutores', rota(async (req, res) => {
  const busca = String(req.query.busca ?? '').trim();
  let sql = `
    SELECT t.id, t.nome, t.cpf, t.telefone, t.email, COUNT(p.id) AS total_pets
      FROM tutores t
      LEFT JOIN pets p ON p.tutor_id = t.id`;
  const parametros = [];

  if (busca) {
    const digitos = somenteDigitos(busca);
    if (digitos.length === 11) {
      sql += ' WHERE t.cpf = ?';
      parametros.push(digitos);
    } else {
      sql += ' WHERE t.nome LIKE ?';
      parametros.push(`%${busca}%`);
    }
  }
  sql += ' GROUP BY t.id ORDER BY t.nome';

  const [linhas] = await pool.query(sql, parametros);
  res.json(linhas.map((t) => ({ ...t, cpf: mascararCpf(t.cpf), total_pets: Number(t.total_pets) })));
}));

app.get('/api/tutores/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [linhas] = await pool.query('SELECT id, nome, cpf, telefone, email FROM tutores WHERE id = ?', [id]);
  if (linhas.length === 0) return erro(res, 404, 'Tutor não encontrado');
  res.json(linhas[0]);
}));

app.post('/api/tutores', rota(async (req, res) => {
  const v = validarTutor(req.body);
  if (v.erro) return erro(res, 400, v.erro);
  const { nome, cpf, telefone, email } = v.dados;
  const [resultado] = await pool.query(
    'INSERT INTO tutores (nome, cpf, telefone, email) VALUES (?, ?, ?, ?)',
    [nome, cpf, telefone, email],
  );
  const [linhas] = await pool.query('SELECT id, nome, cpf, telefone, email FROM tutores WHERE id = ?', [resultado.insertId]);
  res.status(201).json(linhas[0]);
}));

app.put('/api/tutores/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const v = validarTutor(req.body);
  if (v.erro) return erro(res, 400, v.erro);
  const { nome, cpf, telefone, email } = v.dados;
  const [resultado] = await pool.query(
    'UPDATE tutores SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE id = ?',
    [nome, cpf, telefone, email, id],
  );
  if (resultado.affectedRows === 0) return erro(res, 404, 'Tutor não encontrado');
  const [linhas] = await pool.query('SELECT id, nome, cpf, telefone, email FROM tutores WHERE id = ?', [id]);
  res.json(linhas[0]);
}));

app.delete('/api/tutores/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM pets WHERE tutor_id = ?', [id]);
  if (Number(total) > 0) return erro(res, 409, 'Tutor possui pets cadastrados');
  const [resultado] = await pool.query('DELETE FROM tutores WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) return erro(res, 404, 'Tutor não encontrado');
  res.status(204).end();
}));

app.get('/api/tutores/:id/pets', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [tutor] = await pool.query('SELECT id FROM tutores WHERE id = ?', [id]);
  if (tutor.length === 0) return erro(res, 404, 'Tutor não encontrado');
  const [linhas] = await pool.query(`${SELECT_PET} WHERE p.tutor_id = ? ORDER BY p.nome`, [id]);
  res.json(linhas.map(formatarPet));
}));

// ---------------------------------------------------------------------------
// Pets - CRUD + inativação
// ---------------------------------------------------------------------------
app.get('/api/pets', rota(async (req, res) => {
  const condicoes = [];
  const parametros = [];
  const situacao = String(req.query.situacao || 'ativo');

  if (situacao === 'ativo') condicoes.push('p.ativo = TRUE');
  else if (situacao === 'inativo') condicoes.push('p.ativo = FALSE');
  else if (situacao !== 'todos') return erro(res, 400, 'Situação deve ser ativo, inativo ou todos');

  if (req.query.especie) {
    condicoes.push('p.especie = ?');
    parametros.push(String(req.query.especie));
  }
  if (req.query.tutor_id) {
    condicoes.push('p.tutor_id = ?');
    parametros.push(Number(req.query.tutor_id));
  }

  const where = condicoes.length ? ` WHERE ${condicoes.join(' AND ')}` : '';
  const [linhas] = await pool.query(`${SELECT_PET}${where} ORDER BY p.nome`, parametros);
  res.json(linhas.map(formatarPet));
}));

app.get('/api/pets/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [linhas] = await pool.query(`${SELECT_PET} WHERE p.id = ?`, [id]);
  if (linhas.length === 0) return erro(res, 404, 'Pet não encontrado');
  res.json(formatarPet(linhas[0]));
}));

app.post('/api/pets', rota(async (req, res) => {
  const v = validarPet(req.body);
  if (v.erro) return erro(res, 400, v.erro);
  const d = v.dados;
  const [resultado] = await pool.query(
    `INSERT INTO pets (tutor_id, veterinario_id, nome, especie, raca, data_nascimento, peso)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.tutor_id, d.veterinario_id, d.nome, d.especie, d.raca, d.data_nascimento, d.peso],
  );
  const [linhas] = await pool.query(`${SELECT_PET} WHERE p.id = ?`, [resultado.insertId]);
  res.status(201).json(formatarPet(linhas[0]));
}));

app.put('/api/pets/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const v = validarPet(req.body);
  if (v.erro) return erro(res, 400, v.erro);
  const d = v.dados;
  const [resultado] = await pool.query(
    `UPDATE pets
        SET tutor_id = ?, veterinario_id = ?, nome = ?, especie = ?, raca = ?, data_nascimento = ?, peso = ?
      WHERE id = ?`,
    [d.tutor_id, d.veterinario_id, d.nome, d.especie, d.raca, d.data_nascimento, d.peso, id],
  );
  if (resultado.affectedRows === 0) return erro(res, 404, 'Pet não encontrado');
  const [linhas] = await pool.query(`${SELECT_PET} WHERE p.id = ?`, [id]);
  res.json(formatarPet(linhas[0]));
}));

app.patch('/api/pets/:id/situacao', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  if (typeof req.body.ativo !== 'boolean') return erro(res, 400, 'Informe ativo como true ou false');
  const [resultado] = await pool.query('UPDATE pets SET ativo = ? WHERE id = ?', [req.body.ativo, id]);
  if (resultado.affectedRows === 0) return erro(res, 404, 'Pet não encontrado');
  res.json({ id, ativo: req.body.ativo });
}));

app.delete('/api/pets/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  try {
    const [resultado] = await pool.query('DELETE FROM pets WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return erro(res, 404, 'Pet não encontrado');
    res.status(204).end();
  } catch (e) {
    // Quando existir a tabela de consultas (30/10), pet com consultas não pode ser excluído
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return erro(res, 409, 'Pet possui consultas; utilize a inativação');
    tratarErroBanco(e, res);
  }
});

// Qualquer outra rota /api inexistente
app.use('/api', (req, res) => erro(res, 404, 'Rota não encontrada'));

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
app.listen(PORTA, async () => {
  console.log(`Servidor VetCare rodando na porta ${PORTA}`);
  try {
    await pool.query('SELECT 1');
    console.log(`Conectado ao RDS MySQL em ${process.env.DB_HOST}`);
  } catch (e) {
    console.error(`Falha ao conectar ao RDS: ${e.code || e.message}`);
  }
});

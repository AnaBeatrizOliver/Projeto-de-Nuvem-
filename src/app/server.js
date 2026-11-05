// VetCare - API e telas do sistema (RF-01, RF-02, RF-06, RF-07, RF-08, RF-09)
// Executa na EC2 (subnet pública) e acessa o RDS MySQL (subnet privada).
// As configurações vêm de variáveis de ambiente, lidas do arquivo .env que existe
// somente na EC2 e nunca vai para o repositório (RNF-02).
// As credenciais da AWS (para o S3) vêm do LabInstanceProfile associado à EC2.
// Iniciar com:  sudo node --env-file=.env server.js

const crypto = require('crypto');
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

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
const BUCKET_FOTOS = process.env.BUCKET_FOTOS || '';
const RELATORIO_API_URL = process.env.RELATORIO_API_URL || '';
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const ESPECIES = ['Cão', 'Gato', 'Ave', 'Roedor', 'Réptil', 'Outro'];
const TIPOS_FOTO = { 'image/jpeg': 'jpg', 'image/png': 'png' };
const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB
const DURACAO_CONSULTA_MIN = 30;
const ABERTURA_MIN = 8 * 60; // 08:00
const FECHAMENTO_MIN = 18 * 60; // 18:00

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
const mascararCpf = (cpf) => `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;

// Data e hora atuais no fuso de Brasília, no formato 'YYYY-MM-DD HH:MM:SS'
function agoraBrasilia() {
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
  return partes.replace('T', ' ');
}
const hoje = () => agoraBrasilia().slice(0, 10);

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
      return erro(res, 400, 'Registro relacionado informado não existe');
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      return erro(res, 400, 'Dados inválidos');
    default:
      console.error('Erro inesperado:', e.code || e.message);
      return erro(res, 500, 'Erro interno no servidor');
  }
}

// Envolve cada rota para que qualquer erro vire uma resposta JSON
const rota = (fn) => (req, res) => fn(req, res).catch((e) => {
  if (e.status) return erro(res, e.status, e.message);
  return tratarErroBanco(e, res);
});

// Erro de regra de negócio com código HTTP
function falha(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

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

// Converte 'YYYY-MM-DDTHH:MM' (ou com espaço/segundos) para 'YYYY-MM-DD HH:MM:00'
function normalizarDataHora(valor) {
  const texto = String(valor ?? '').trim().replace('T', ' ');
  const m = texto.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})(:\d{2})?$/);
  if (!m) return null;
  if (Number.isNaN(Date.parse(`${m[1]}T${m[2]}:${m[3]}:00Z`))) return null;
  return `${m[1]} ${m[2]}:${m[3]}:00`;
}

// Horário de funcionamento: segunda a sábado, das 8h às 18h (consulta de 30 min precisa terminar até 18h)
function dentroDoFuncionamento(dataHora) {
  const [data, hora] = dataHora.split(' ');
  const [ano, mes, dia] = data.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay(); // 0 = domingo
  const [h, min] = hora.split(':').map(Number);
  const inicio = h * 60 + min;
  return diaSemana !== 0 && inicio >= ABERTURA_MIN && inicio + DURACAO_CONSULTA_MIN <= FECHAMENTO_MIN;
}

// Verifica conflito de horário para o veterinário e para o pet, dentro de uma transação.
// As linhas do veterinário e do pet são bloqueadas (SELECT ... FOR UPDATE), para que dois
// agendamentos simultâneos não passem juntos (ADR-004).
async function verificarConflito(conexao, { petId, veterinarioId, dataHora, ignorarId }) {
  await conexao.query('SELECT id FROM veterinarios WHERE id = ? FOR UPDATE', [veterinarioId]);
  await conexao.query('SELECT id FROM pets WHERE id = ? FOR UPDATE', [petId]);
  const [conflitos] = await conexao.query(
    `SELECT veterinario_id, pet_id
       FROM consultas
      WHERE status <> 'cancelada'
        AND id <> ?
        AND (veterinario_id = ? OR pet_id = ?)
        AND data_hora < DATE_ADD(?, INTERVAL ${DURACAO_CONSULTA_MIN} MINUTE)
        AND DATE_ADD(data_hora, INTERVAL ${DURACAO_CONSULTA_MIN} MINUTE) > ?`,
    [ignorarId || 0, veterinarioId, petId, dataHora, dataHora],
  );
  if (conflitos.some((c) => c.veterinario_id === veterinarioId)) {
    throw falha(409, 'Veterinário já possui consulta neste horário');
  }
  if (conflitos.length > 0) throw falha(409, 'Pet já possui consulta neste horário');
}

async function emTransacao(fn) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await fn(conexao);
    await conexao.commit();
    return resultado;
  } catch (e) {
    await conexao.rollback();
    throw e;
  } finally {
    conexao.release();
  }
}

// URL de leitura temporária (1 hora) de um arquivo do bucket privado
async function urlLeitura(chave) {
  if (!chave || !BUCKET_FOTOS) return null;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET_FOTOS, Key: chave }), { expiresIn: 3600 });
}

const SELECT_PET = `
  SELECT p.id, p.nome, p.especie, p.raca, p.data_nascimento, p.peso, p.ativo,
         p.foto_chave, p.foto_thumbnail_chave, p.foto_status,
         p.tutor_id, t.nome AS tutor_nome,
         p.veterinario_id, v.nome AS veterinario_nome
    FROM pets p
    JOIN tutores t      ON t.id = p.tutor_id
    JOIN veterinarios v ON v.id = p.veterinario_id`;

async function formatarPet(linha) {
  const { foto_chave: fotoChave, foto_thumbnail_chave: thumbChave, ...pet } = linha;
  return {
    ...pet,
    ativo: Boolean(linha.ativo),
    peso: linha.peso === null ? null : Number(linha.peso),
    foto_url: await urlLeitura(fotoChave),
    foto_thumbnail_url: await urlLeitura(thumbChave),
  };
}

const SELECT_CONSULTA = `
  SELECT c.id, c.data_hora, c.motivo, c.observacoes, c.status,
         c.pet_id, p.nome AS pet_nome, p.especie,
         t.nome AS tutor_nome,
         c.veterinario_id, v.nome AS veterinario_nome
    FROM consultas c
    JOIN pets p         ON p.id = c.pet_id
    JOIN tutores t      ON t.id = p.tutor_id
    JOIN veterinarios v ON v.id = c.veterinario_id`;

// ---------------------------------------------------------------------------
// Saúde e configuração (usadas pelas telas)
// ---------------------------------------------------------------------------
app.get('/api/health', rota(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', banco: 'conectado' });
}));

// O endereço do relatório fica no .env, e não no código das telas (RNF-03)
app.get('/api/config', (req, res) => {
  res.json({ relatorio_url: RELATORIO_API_URL || null, fotos_habilitadas: Boolean(BUCKET_FOTOS) });
});

// ---------------------------------------------------------------------------
// Veterinários (somente leitura; carga inicial no final de sql/schema.sql)
// ---------------------------------------------------------------------------
app.get('/api/veterinarios', rota(async (req, res) => {
  const [linhas] = await pool.query('SELECT id, nome, crmv, especialidade FROM veterinarios ORDER BY nome');
  res.json(linhas);
}));

// ---------------------------------------------------------------------------
// Tutores - CRUD (RF-01) + busca (RF-08)
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
  res.json(await Promise.all(linhas.map(formatarPet)));
}));

// ---------------------------------------------------------------------------
// Pets - CRUD (RF-01) + filtros (RF-08) + inativação (RF-09)
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
  res.json(await Promise.all(linhas.map(formatarPet)));
}));

app.get('/api/pets/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [linhas] = await pool.query(`${SELECT_PET} WHERE p.id = ?`, [id]);
  if (linhas.length === 0) return erro(res, 404, 'Pet não encontrado');
  res.json(await formatarPet(linhas[0]));
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
  res.status(201).json(await formatarPet(linhas[0]));
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
  res.json(await formatarPet(linhas[0]));
}));

// Inativar cancela automaticamente as consultas futuras do pet (spec US-02)
app.patch('/api/pets/:id/situacao', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  if (typeof req.body.ativo !== 'boolean') return erro(res, 400, 'Informe ativo como true ou false');
  const ativo = req.body.ativo;

  const consultasCanceladas = await emTransacao(async (conexao) => {
    const [resultado] = await conexao.query('UPDATE pets SET ativo = ? WHERE id = ?', [ativo, id]);
    if (resultado.affectedRows === 0) throw falha(404, 'Pet não encontrado');
    if (ativo) return 0;
    const [cancelamento] = await conexao.query(
      `UPDATE consultas SET status = 'cancelada'
        WHERE pet_id = ? AND status = 'agendada' AND data_hora > ?`,
      [id, agoraBrasilia()],
    );
    return cancelamento.affectedRows;
  });

  res.json({ id, ativo, consultas_canceladas: consultasCanceladas });
}));

app.delete('/api/pets/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  try {
    const [resultado] = await pool.query('DELETE FROM pets WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return erro(res, 404, 'Pet não encontrado');
    res.status(204).end();
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return erro(res, 409, 'Pet possui consultas; utilize a inativação');
    tratarErroBanco(e, res);
  }
});

// ---------------------------------------------------------------------------
// Foto do pet (RF-02): URL pré-assinada para envio direto do navegador ao S3
// ---------------------------------------------------------------------------
app.post('/api/pets/:id/foto/upload-url', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  if (!BUCKET_FOTOS) return erro(res, 503, 'Upload de fotos não configurado no servidor');

  const tipo = String(req.body.content_type || '');
  const extensao = TIPOS_FOTO[tipo];
  if (!extensao) return erro(res, 400, 'Formato não permitido: envie JPG ou PNG');

  const [pet] = await pool.query('SELECT id FROM pets WHERE id = ?', [id]);
  if (pet.length === 0) return erro(res, 404, 'Pet não encontrado');

  // O caminho uploads/ é o único que dispara a Lambda de miniatura (evita loop)
  const chave = `uploads/pets/${id}/${crypto.randomUUID()}.${extensao}`;
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: BUCKET_FOTOS,
    Key: chave,
    Conditions: [
      ['content-length-range', 1, TAMANHO_MAXIMO_FOTO],
      ['eq', '$Content-Type', tipo],
    ],
    Fields: { 'Content-Type': tipo },
    Expires: 300, // 5 minutos
  });
  res.json({ url, campos: fields, chave, expira_em_segundos: 300 });
}));

// ---------------------------------------------------------------------------
// Consultas (RF-06) e histórico do pet (RF-07)
// ---------------------------------------------------------------------------
function validarConsulta(corpo) {
  const petId = Number(corpo.pet_id);
  const veterinarioId = Number(corpo.veterinario_id);
  const dataHora = normalizarDataHora(corpo.data_hora);
  const motivo = String(corpo.motivo ?? '').trim();
  const observacoes = String(corpo.observacoes ?? '').trim() || null;

  if (!idValido(petId)) return { erro: 'Selecione o pet' };
  if (!idValido(veterinarioId)) return { erro: 'Selecione o veterinário' };
  if (!dataHora) return { erro: 'Data e hora inválidas' };
  if (!motivo || motivo.length > 200) return { erro: 'Motivo é obrigatório (até 200 caracteres)' };
  if (!dentroDoFuncionamento(dataHora)) {
    return { erro: 'Fora do horário de funcionamento (segunda a sábado, das 8h às 18h)' };
  }
  return { dados: { pet_id: petId, veterinario_id: veterinarioId, data_hora: dataHora, motivo, observacoes } };
}

app.get('/api/consultas', rota(async (req, res) => {
  const condicoes = [];
  const parametros = [];
  if (req.query.data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.data))) return erro(res, 400, 'Data inválida');
    condicoes.push('DATE(c.data_hora) = ?');
    parametros.push(String(req.query.data));
  }
  if (req.query.veterinario_id) {
    condicoes.push('c.veterinario_id = ?');
    parametros.push(Number(req.query.veterinario_id));
  }
  const where = condicoes.length ? ` WHERE ${condicoes.join(' AND ')}` : '';
  const [linhas] = await pool.query(`${SELECT_CONSULTA}${where} ORDER BY c.data_hora LIMIT 200`, parametros);
  res.json(linhas);
}));

app.get('/api/consultas/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [linhas] = await pool.query(`${SELECT_CONSULTA} WHERE c.id = ?`, [id]);
  if (linhas.length === 0) return erro(res, 404, 'Consulta não encontrada');
  res.json(linhas[0]);
}));

// Agendar (data futura) ou registrar um atendimento já realizado (encaixe, data passada ou atual)
app.post('/api/consultas', rota(async (req, res) => {
  const v = validarConsulta(req.body);
  if (v.erro) return erro(res, 400, v.erro);
  const d = v.dados;
  const jaRealizada = req.body.realizada === true;
  const agora = agoraBrasilia();

  if (!jaRealizada && d.data_hora <= agora) return erro(res, 400, 'Para agendar, escolha uma data e hora futuras');
  if (jaRealizada && d.data_hora > agora) return erro(res, 400, 'Um atendimento realizado não pode ter data futura');

  const id = await emTransacao(async (conexao) => {
    const [pet] = await conexao.query('SELECT ativo FROM pets WHERE id = ?', [d.pet_id]);
    if (pet.length === 0) throw falha(400, 'Pet informado não existe');
    if (!pet[0].ativo) throw falha(400, 'Não é possível registrar consulta para um pet inativo');
    const [vet] = await conexao.query('SELECT id FROM veterinarios WHERE id = ?', [d.veterinario_id]);
    if (vet.length === 0) throw falha(400, 'Veterinário informado não existe');

    await verificarConflito(conexao, { petId: d.pet_id, veterinarioId: d.veterinario_id, dataHora: d.data_hora });
    const [resultado] = await conexao.query(
      `INSERT INTO consultas (pet_id, veterinario_id, data_hora, motivo, observacoes, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [d.pet_id, d.veterinario_id, d.data_hora, d.motivo, d.observacoes, jaRealizada ? 'realizada' : 'agendada'],
    );
    return resultado.insertId;
  });

  const [linhas] = await pool.query(`${SELECT_CONSULTA} WHERE c.id = ?`, [id]);
  res.status(201).json(linhas[0]);
}));

// Remarcar: somente consultas agendadas, sem conflitar com elas mesmas
app.put('/api/consultas/:id', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const v = validarConsulta(req.body);
  if (v.erro) return erro(res, 400, v.erro);
  const d = v.dados;
  if (d.data_hora <= agoraBrasilia()) return erro(res, 400, 'Para remarcar, escolha uma data e hora futuras');

  await emTransacao(async (conexao) => {
    const [atual] = await conexao.query('SELECT pet_id, status FROM consultas WHERE id = ? FOR UPDATE', [id]);
    if (atual.length === 0) throw falha(404, 'Consulta não encontrada');
    if (atual[0].status !== 'agendada') throw falha(409, 'Somente consultas agendadas podem ser remarcadas');
    if (atual[0].pet_id !== d.pet_id) throw falha(400, 'O pet da consulta não pode ser alterado');

    await verificarConflito(conexao, { petId: d.pet_id, veterinarioId: d.veterinario_id, dataHora: d.data_hora, ignorarId: id });
    await conexao.query(
      'UPDATE consultas SET veterinario_id = ?, data_hora = ?, motivo = ?, observacoes = ? WHERE id = ?',
      [d.veterinario_id, d.data_hora, d.motivo, d.observacoes, id],
    );
  });

  const [linhas] = await pool.query(`${SELECT_CONSULTA} WHERE c.id = ?`, [id]);
  res.json(linhas[0]);
}));

// Registrar como realizada (somente depois do horário) ou cancelar
app.patch('/api/consultas/:id/status', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const novoStatus = String(req.body.status || '');
  if (!['realizada', 'cancelada'].includes(novoStatus)) return erro(res, 400, 'Status deve ser realizada ou cancelada');

  const [linhas] = await pool.query('SELECT status, data_hora FROM consultas WHERE id = ?', [id]);
  if (linhas.length === 0) return erro(res, 404, 'Consulta não encontrada');
  const consulta = linhas[0];
  if (consulta.status !== 'agendada') return erro(res, 409, 'Consultas realizadas ou canceladas não podem ser alteradas');
  if (novoStatus === 'realizada' && consulta.data_hora > agoraBrasilia()) {
    return erro(res, 400, 'A consulta só pode ser registrada como realizada depois do horário marcado');
  }

  const observacoes = String(req.body.observacoes ?? '').trim();
  if (observacoes) {
    await pool.query('UPDATE consultas SET status = ?, observacoes = ? WHERE id = ?', [novoStatus, observacoes, id]);
  } else {
    await pool.query('UPDATE consultas SET status = ? WHERE id = ?', [novoStatus, id]);
  }
  const [atualizada] = await pool.query(`${SELECT_CONSULTA} WHERE c.id = ?`, [id]);
  res.json(atualizada[0]);
}));

app.get('/api/pets/:id/consultas', rota(async (req, res) => {
  const id = Number(req.params.id);
  if (!idValido(id)) return erro(res, 400, 'ID inválido');
  const [pet] = await pool.query('SELECT id FROM pets WHERE id = ?', [id]);
  if (pet.length === 0) return erro(res, 404, 'Pet não encontrado');
  const parametros = [id];
  let filtro = '';
  if (req.query.status) {
    filtro = ' AND c.status = ?';
    parametros.push(String(req.query.status));
  }
  const [linhas] = await pool.query(`${SELECT_CONSULTA} WHERE c.pet_id = ?${filtro} ORDER BY c.data_hora DESC`, parametros);
  res.json(linhas);
}));

// Qualquer outra rota /api inexistente
app.use('/api', (req, res) => erro(res, 404, 'Rota não encontrada'));

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
app.listen(PORTA, async () => {
  console.log(`Servidor VetCare rodando na porta ${PORTA}`);
  console.log(BUCKET_FOTOS ? `Fotos no bucket ${BUCKET_FOTOS}` : 'Aviso: BUCKET_FOTOS não configurado (upload de fotos desativado)');
  console.log(RELATORIO_API_URL ? 'Relatório configurado (API Gateway)' : 'Aviso: RELATORIO_API_URL não configurado');
  try {
    await pool.query('SELECT 1');
    console.log(`Conectado ao RDS MySQL em ${process.env.DB_HOST}`);
  } catch (e) {
    console.error(`Falha ao conectar ao RDS: ${e.code || e.message}`);
  }
});

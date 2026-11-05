// VetCare - Lambda do relatório (RF-04)
// Exposta pelo API Gateway (HTTP API) na rota GET /relatorios/consultas-por-veterinario.
// Retorna, para cada veterinário e espécie, a quantidade de consultas REALIZADAS no período,
// usando JOIN entre consultas, pets e veterinários e GROUP BY por veterinário e espécie.
//
// Parâmetros (query string): inicio=YYYY-MM-DD e fim=YYYY-MM-DD. Sem período: últimos 30 dias.
// Runtime: Node.js 22.x · Executa na VPC (subnets privadas) com a LabRole.
// Variáveis de ambiente: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.

const mysql = require('mysql2/promise');

let pool;
function banco() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'vetcare',
      connectionLimit: 2,
    });
  }
  return pool;
}

const CABECALHOS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

function resposta(status, corpo) {
  return { statusCode: status, headers: CABECALHOS, body: JSON.stringify(corpo) };
}

// Data no fuso de Brasília, deslocada em "dias" (formato YYYY-MM-DD)
function dataBrasilia(dias = 0) {
  const data = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  return data.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

const dataValida = (texto) => /^\d{4}-\d{2}-\d{2}$/.test(texto) && !Number.isNaN(Date.parse(texto));

const SQL_RELATORIO = `
  SELECT v.nome    AS veterinario,
         p.especie AS especie,
         COUNT(*)  AS total_consultas
    FROM consultas c
    JOIN pets p         ON p.id = c.pet_id
    JOIN veterinarios v ON v.id = c.veterinario_id
   WHERE c.status = 'realizada'
     AND c.data_hora >= ?
     AND c.data_hora <  DATE_ADD(?, INTERVAL 1 DAY)
   GROUP BY v.nome, p.especie
   ORDER BY v.nome, total_consultas DESC`;

exports.handler = async (evento) => {
  const parametros = evento.queryStringParameters || {};
  const inicio = parametros.inicio || dataBrasilia(-30);
  const fim = parametros.fim || dataBrasilia(0);

  if (!dataValida(inicio) || !dataValida(fim)) {
    return resposta(400, { erro: 'Datas devem estar no formato AAAA-MM-DD' });
  }
  if (inicio > fim) {
    return resposta(400, { erro: 'A data inicial não pode ser maior que a final' });
  }

  try {
    const [linhas] = await banco().query(SQL_RELATORIO, [inicio, fim]);
    console.log(`[relatorio] período ${inicio} a ${fim}: ${linhas.length} linha(s)`);
    return resposta(200, {
      periodo: { inicio, fim },
      resultado: linhas.map((l) => ({
        veterinario: l.veterinario,
        especie: l.especie,
        total_consultas: Number(l.total_consultas),
      })),
    });
  } catch (e) {
    console.error(`[relatorio] erro: ${e.code || e.message}`);
    return resposta(500, { erro: 'Erro ao gerar o relatório' });
  }
};

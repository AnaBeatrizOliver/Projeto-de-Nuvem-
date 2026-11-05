// VetCare - Lambda de miniatura (RF-03)
// Disparada pelo evento s3:ObjectCreated do bucket de fotos, SOMENTE para o prefixo uploads/.
// Gera uma miniatura de até 150x150 px (mantendo a proporção), grava em thumbnails/
// e atualiza o cadastro do pet no RDS. Como thumbnails/ não está no filtro do evento,
// a miniatura não dispara a Lambda de novo (sem loop).
//
// Runtime: Node.js 22.x · Executa na VPC (subnets privadas) com a LabRole.
// Acessa o S3 pelo VPC Gateway Endpoint e o RDS pela rede interna da VPC.
// Variáveis de ambiente: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Jimp } = require('jimp');
const mysql = require('mysql2/promise');

const s3 = new S3Client({});
const TAMANHO_MINIATURA = 150;
const PADRAO_CHAVE = /^uploads\/pets\/(\d+)\/([0-9a-f-]+)\.(jpg|png)$/;

// A conexão é criada fora do handler para ser reaproveitada entre execuções
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

async function processarArquivo(bucket, chave) {
  const inicio = Date.now();
  console.log(`[miniatura] início: ${chave}`);

  const correspondencia = chave.match(PADRAO_CHAVE);
  if (!correspondencia) {
    console.error(`[miniatura] erro: caminho fora do padrão esperado (${chave})`);
    return { chave, resultado: 'ignorado' };
  }
  const petId = Number(correspondencia[1]);
  const identificador = correspondencia[2];

  const [pets] = await banco().query('SELECT id FROM pets WHERE id = ?', [petId]);
  if (pets.length === 0) {
    console.error(`[miniatura] erro: pet ${petId} não existe; nenhum cadastro alterado`);
    return { chave, resultado: 'pet inexistente' };
  }

  // Marca como processando; a foto anterior continua valendo até a miniatura ficar pronta
  await banco().query("UPDATE pets SET foto_status = 'processando' WHERE id = ?", [petId]);

  try {
    const original = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: chave }));
    const bytes = Buffer.from(await original.Body.transformToByteArray());

    const imagem = await Jimp.read(bytes);
    imagem.scaleToFit({ w: TAMANHO_MINIATURA, h: TAMANHO_MINIATURA });
    const miniatura = await imagem.getBuffer('image/jpeg');

    const chaveMiniatura = `thumbnails/pets/${petId}/${identificador}.jpg`;
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: chaveMiniatura,
      Body: miniatura,
      ContentType: 'image/jpeg',
    }));

    await banco().query(
      "UPDATE pets SET foto_chave = ?, foto_thumbnail_chave = ?, foto_status = 'pronta' WHERE id = ?",
      [chave, chaveMiniatura, petId],
    );
    console.log(`[miniatura] fim: pet ${petId} atualizado com ${chaveMiniatura} (${Date.now() - inicio} ms)`);
    return { chave, resultado: 'pronta' };
  } catch (e) {
    console.error(`[miniatura] erro ao processar ${chave}: ${e.message}`);
    await banco().query("UPDATE pets SET foto_status = 'erro' WHERE id = ?", [petId]);
    return { chave, resultado: 'erro' };
  }
}

exports.handler = async (evento) => {
  const resultados = [];
  for (const registro of evento.Records || []) {
    const bucket = registro.s3.bucket.name;
    const chave = decodeURIComponent(registro.s3.object.key.replace(/\+/g, ' '));
    resultados.push(await processarArquivo(bucket, chave));
  }
  return resultados;
};

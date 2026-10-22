import { ensureSchema, getSql, normalizeAndHashRa, sendJson } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  try {
    await ensureSchema();
    const { ra, digito, chapa } = req.body || {};

    if (!['15', '100'].includes(String(chapa))) {
      return sendJson(res, 400, { error: 'Chapa inválida.' });
    }

    const raHash = normalizeAndHashRa(ra, digito);
    const sql = getSql();
    const inserted = await sql`
      INSERT INTO gremio_votes (ra_hash, chapa)
      VALUES (${raHash}, ${String(chapa)})
      ON CONFLICT (ra_hash) DO NOTHING
      RETURNING id
    `;

    if (!inserted.length) {
      return sendJson(res, 409, {
        error: 'Este RA já registrou um voto anteriormente.',
        code: 'ALREADY_VOTED'
      });
    }

    return sendJson(res, 201, { ok: true });
  } catch (error) {
    console.error(error);
    if (error?.code === 'INVALID_RA') return sendJson(res, 400, { error: error.message });
    if (error?.code === 'CONFIG_ERROR') return sendJson(res, 503, { error: 'Sistema ainda não foi configurado completamente.' });
    return sendJson(res, 500, { error: 'Erro interno ao registrar o voto.' });
  }
}

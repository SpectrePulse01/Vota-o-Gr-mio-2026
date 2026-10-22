import { adminIsValid, ensureSchema, getResults, getSql, sendJson } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  try {
    await ensureSchema();
    const { action, user, password, confirmation } = req.body || {};

    if (!adminIsValid(user, password)) {
      return sendJson(res, 401, { error: 'Credenciais incorretas.' });
    }

    if (action === 'results') {
      return sendJson(res, 200, await getResults());
    }

    if (action === 'reset') {
      if (confirmation !== 'ZERAR') {
        return sendJson(res, 400, { error: 'Confirmação inválida.' });
      }
      const sql = getSql();
      await sql`TRUNCATE TABLE gremio_votes RESTART IDENTITY`;
      return sendJson(res, 200, await getResults());
    }

    return sendJson(res, 400, { error: 'Ação inválida.' });
  } catch (error) {
    console.error(error);
    if (error?.code === 'CONFIG_ERROR') {
      return sendJson(res, 503, { error: 'Sistema ainda não foi configurado completamente.' });
    }
    return sendJson(res, 500, { error: 'Erro interno no painel administrativo.' });
  }
}

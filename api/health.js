import { getConfigStatus, sendJson } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Método não permitido.' });
  }

  const config = getConfigStatus();
  const ready = config.database && config.raHashSecret && config.adminPassword;

  return sendJson(res, ready ? 200 : 503, {
    ok: ready,
    config
  });
}

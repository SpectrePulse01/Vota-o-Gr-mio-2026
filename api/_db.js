import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

let schemaReady = false;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || '';
}

export function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    const error = new Error('Banco de dados não configurado na Vercel.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }
  return neon(databaseUrl);
}

export async function ensureSchema() {
  if (schemaReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS gremio_votes (
      id BIGSERIAL PRIMARY KEY,
      ra_hash TEXT UNIQUE NOT NULL,
      chapa TEXT NOT NULL CHECK (chapa IN ('15', '100')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  schemaReady = true;
}

export function normalizeAndHashRa(ra, digito) {
  const normalizedRa = String(ra ?? '').trim();
  const normalizedDigit = String(digito ?? '').trim().toUpperCase();

  if (!/^\d{1,9}$/.test(normalizedRa) || !/^[0-9A-Z]{1,2}$/.test(normalizedDigit)) {
    const error = new Error('RA ou dígito inválido.');
    error.code = 'INVALID_RA';
    throw error;
  }

  const secret = process.env.RA_HASH_SECRET;
  if (!secret || secret.length < 16) {
    const error = new Error('RA_HASH_SECRET não configurado na Vercel.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  return crypto
    .createHmac('sha256', secret)
    .update(`${normalizedRa}-${normalizedDigit}`)
    .digest('hex');
}

export function adminIsValid(user, password) {
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || '';
  if (!expectedPassword) return false;

  const userBuffer = Buffer.from(String(user ?? ''));
  const expectedUserBuffer = Buffer.from(expectedUser);
  const passwordBuffer = Buffer.from(String(password ?? ''));
  const expectedPasswordBuffer = Buffer.from(expectedPassword);

  return userBuffer.length === expectedUserBuffer.length &&
    passwordBuffer.length === expectedPasswordBuffer.length &&
    crypto.timingSafeEqual(userBuffer, expectedUserBuffer) &&
    crypto.timingSafeEqual(passwordBuffer, expectedPasswordBuffer);
}

export async function getResults() {
  const sql = getSql();
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE chapa = '15')::int AS chapa_15,
      COUNT(*) FILTER (WHERE chapa = '100')::int AS chapa_100,
      COUNT(*)::int AS total
    FROM gremio_votes
  `;
  const row = rows[0] || {};
  return {
    counts: {
      '15': Number(row.chapa_15 || 0),
      '100': Number(row.chapa_100 || 0)
    },
    total: Number(row.total || 0)
  };
}

export function getConfigStatus() {
  return {
    database: Boolean(getDatabaseUrl()),
    raHashSecret: Boolean(process.env.RA_HASH_SECRET && process.env.RA_HASH_SECRET.length >= 16),
    adminPassword: Boolean(process.env.ADMIN_PASSWORD)
  };
}

export function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(status).json(payload);
}

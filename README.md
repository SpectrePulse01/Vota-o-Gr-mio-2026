# Votação Grêmio 2026

Sistema de votação do Grêmio Estudantil da E.E. Profª Enny Tereza Longo Fracaro, preparado para Vercel.

## O que esta versão faz

- Centraliza os votos em PostgreSQL (Neon).
- Bloqueia o mesmo RA mesmo se a pessoa tentar votar em outro aparelho.
- Não salva o RA em texto puro: o RA + dígito são convertidos em HMAC SHA-256.
- Mantém a senha do painel ADM fora do código público.
- Exibe a apuração centralizada no painel administrativo.
- Permite exportar a contagem em CSV e zerar a votação com confirmação extra.

## Deploy na Vercel

Importe este repositório normalmente na Vercel. Não é necessário alterar o Root Directory.

Antes de usar a votação, crie/conecte um banco PostgreSQL Neon e configure as variáveis de ambiente abaixo no projeto da Vercel:

- `DATABASE_URL` = URL de conexão do banco Neon
- `RA_HASH_SECRET` = uma chave secreta longa (mínimo 16 caracteres; use algo aleatório)
- `ADMIN_PASSWORD` = senha do painel administrativo
- `ADMIN_USER` = opcional; se não definir, o usuário será `admin`

Depois de salvar as variáveis, faça um novo deploy. A tabela `gremio_votes` será criada automaticamente no primeiro acesso à API.

## Observação importante

O sistema impede que o mesmo RA vote duas vezes, mas não confirma sozinho se o RA digitado realmente pertence a um aluno matriculado na escola. Para validação de matrícula seria necessário integrar uma lista/autenticação oficial de alunos.

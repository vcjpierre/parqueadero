import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import mysql from 'mysql2/promise';

function parseSqlWithDelimiters(sql_text) {
  const lines = sql_text.replace(/\r\n/g, '\n').split('\n');

  /** @type {string} */
  let current_delimiter = ';';
  /** @type {string[]} */
  const statements = [];
  /** @type {string[]} */
  let buffer = [];

  function flushBuffer(force = false) {
    const raw = buffer.join('\n').trim();
    buffer = [];
    if (!raw) return;
    if (!force) return;
    statements.push(raw);
  }

  function commitIfDelimiterHit() {
    const joined = buffer.join('\n');
    const idx = joined.lastIndexOf(current_delimiter);
    if (idx === -1) return;

    const before = joined.slice(0, idx).trim();
    const after = joined.slice(idx + current_delimiter.length);

    buffer = [];
    if (before) statements.push(before);

    if (after.trim()) buffer.push(after);
  }

  for (const raw_line of lines) {
    const line = raw_line;

    const delimiter_match = line.match(/^\s*DELIMITER\s+(.+)\s*$/i);
    if (delimiter_match) {
      commitIfDelimiterHit();
      flushBuffer(true);
      current_delimiter = delimiter_match[1];
      continue;
    }

    // Skip full-line comments
    if (/^\s*--/.test(line)) continue;

    buffer.push(line);
    commitIfDelimiterHit();
  }

  flushBuffer(true);
  return statements.map((s) => s.trim()).filter(Boolean);
}

async function main() {
  const mysql_url =
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL ||
    '';

  /** @type {{ host: string, port: number, user: string, password: string }} */
  let connection_options;

  if (mysql_url) {
    const url = new URL(mysql_url);
    connection_options = {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
  } else {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD } = process.env;
    if (!DB_HOST || !DB_PORT || !DB_USER) {
      throw new Error(
        'Faltan variables para DB. Usa `railway run --service MySQL -- ...` (recomendado) o define DB_HOST/DB_PORT/DB_USER/DB_PASSWORD.'
      );
    }
    connection_options = {
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD ?? '',
    };
  }

  const schema_path = path.resolve(process.cwd(), 'schema.sql');
  const schema_sql = await fs.readFile(schema_path, 'utf8');
  const statements = parseSqlWithDelimiters(schema_sql);

  const connection = await mysql.createConnection({
    ...connection_options,
    multipleStatements: true,
  });

  try {
    for (let i = 0; i < statements.length; i += 1) {
      const statement = statements[i];
      await connection.query(statement);
    }
  } finally {
    await connection.end();
  }

  console.log(`OK: schema.sql aplicado (${statements.length} statements).`);
}

await main();


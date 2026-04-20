import mysql from 'mysql2/promise';

async function main() {
  if (!process.env.MYSQL_PUBLIC_URL)
    throw new Error('Falta MYSQL_PUBLIC_URL (ejecuta con `railway run --service MySQL -- ...`).');

  const url = new URL(process.env.MYSQL_PUBLIC_URL);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  });

  try {
    const [dbs] = await connection.query('SHOW DATABASES');
    console.log('databases:', dbs.map((r) => r.Database));

    const [tables] = await connection.query('SHOW TABLES FROM parqueadero');
    console.log('parqueadero tables:', tables.length);
  } finally {
    await connection.end();
  }
}

await main();


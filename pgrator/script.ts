import * as path from 'path';
import * as process from 'process';
import * as dotenv from 'dotenv';
import * as pg from 'pg';
import Postgrator from 'postgrator';
import { Migration } from 'postgrator';
import chalk from 'chalk';
import { Transform } from 'stream';
import { Console } from 'console';

dotenv.config();

async function main() {
  const { PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD, DATABASE_SSL } =
    process.env;

  const flag = <'--clear'>process.argv?.[2];

  if (flag != null && flag != '--clear') {
    console.error(chalk.redBright('Invalid Argument!'));
    return;
  }

  const client = new pg.Client({
    host: PG_HOST,
    port: Number(PG_PORT),
    database: PG_DATABASE,
    user: PG_USER,
    password: PG_PASSWORD,
    ssl: DATABASE_SSL != null ? { rejectUnauthorized: false } : false,
  });

  try {
    await client
      .connect()
      .then(() => console.log('=== pgClient connected ==='));

    const postgrator = new Postgrator({
      migrationPattern: path.join(__dirname, 'migrations/*'),
      driver: 'pg',
      database: PG_DATABASE,
      schemaTable: 'schema_migration',
      execQuery: (query) => client.query(query),
    });

    const maxVersionAvailable = await postgrator.getMaxVersion();

    const version = (await postgrator.getDatabaseVersion()) ?? 0;

    console.log(
      `[ CurrentDbVersion: ${chalk.blueBright(
        version,
      )} MaxAvailableVersion: ${chalk.yellowBright(
        maxVersionAvailable,
      )} ] ${chalk.yellowBright('(Before Migration)')}`,
    );

    const migrations = await postgrator.getMigrations();

    console.log(`${migrations.length} total migrations`);

    const schemaMigration = await postgrator.runQuery(
      `SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'schema_migration'
   )`,
    );

    if (schemaMigration.rows?.[0]?.exists) {
      await postgrator
        .validateMigrations(maxVersionAvailable)
        .catch(async (err) => {
          if (flag == null) {
            err.message +=
              '\n consider running migration with --clear to clear your schemaTable and re-run all migrations';

            throw err;
          }
          console.log(err.message);
          console.log('dropping schema_migration');
          await postgrator.runQuery(`DROP TABLE IF EXISTS schema_migration`);
          console.log('re-running all migrations');
          return;
        });
    }

    const appliedMigrations = await postgrator.migrate('max');

    if (appliedMigrations.length < 1) {
      console.log('No Migrations Applied');
    } else {
      console.log(`${appliedMigrations.length} Migration Applied 🚀`);

      printAppliedMigrations(appliedMigrations);
    }

    const updatedMaxVersionAvailable = await postgrator.getMaxVersion();

    const updatedVersion = await postgrator.getDatabaseVersion();

    console.log(
      `[ CurrentDbVersion: ${chalk.blueBright(
        updatedVersion,
      )} MaxAvailableVersion: ${chalk.yellowBright(
        updatedMaxVersionAvailable,
      )} ] ${chalk.greenBright('(After Migration)')}`,
    );
  } catch (error) {
    console.error(error);
    console.log(error.constructor.name);
    console.log(chalk.redBright('Migration Failed!'));
  }

  await client.end();
}

function printAppliedMigrations(migrations: Migration[]): void {
  const parsedMigrations = migrations.map((m) => ({
    name: m.name,
    action: m.action,
    file: path.basename(m.filename),
    md5: m.md5,
  }));

  printTable(parsedMigrations);
}

export function printTable(input: any) {
  const ts = new Transform({
    transform(chunk, enc, cb) {
      cb(null, chunk);
    },
  });
  const logger = new Console({ stdout: ts });
  logger.table(input);
  const table = (ts.read() || '').toString();
  let result = '';
  for (let row of table.split(/[\r\n]+/)) {
    let r = row.replace(/[^┬]*┬/, '┌');
    r = r.replace(/^├─*┼/, '├');
    r = r.replace(/│[^│]*/, '');
    r = r.replace(/^└─*┴/, '└');
    r = r.replace(/'/g, ' ');
    result += `${r}\n`;
  }
  console.log(result);
}

main();

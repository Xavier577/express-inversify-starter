import knex, { Knex } from 'knex';
import pg from 'pg';
import { Env } from '@app/internal/env';
import process from 'process';
import Deasyncify from 'deasyncify';
import { Logger } from '@app/internal/logger';

pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat);
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

export async function postgresFactory(env: Env, logger: Logger): Promise<Knex> {
  const pg = knex({
    client: 'pg',
    connection: {
      host: env.get<string>('PG_HOST'),
      port: env.get<number>('PG_PORT'),
      database: env.get<string>('PG_DATABASE'),
      user: env.get<string>('PG_USER'),
      password: env.get<string>('PG_PASSWORD'),
      ssl: env.get<boolean>('DATABASE_SSL')
        ? { rejectUnauthorized: false }
        : false,
    },
    debug: env.get<boolean>('KNEX_DEBUG'),
  });

  let retry = env.get<number>('DATABASE_RETRY');

  while (retry > 0) {
    // check db connection
    let [current_database, err] = await Deasyncify.watch(
      pg.raw('SELECT current_database()').then(({ rows }) => {
        const [{ current_database }] = rows;
        return current_database;
      }),
    );

    retry -= 1;

    if (
      current_database != null &&
      current_database != env.get<string>('PG_DATABASE')
    ) {
      throw new Error(`database ${env.get<string>('PG_DATABASE')} not found`);
    }

    if (err != null) {
      logger.error(err);

      logger.log(`Failed to connect to database ........ retry (${retry})`);

      if (retry < 1) {
        logger.log('Exiting....');
        process.exit(1);
      }

      continue;
    }

    logger.log(`Successfully connect to ${current_database} database`);
    return pg;
  }
}

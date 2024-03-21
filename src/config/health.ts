import { Knex } from 'knex';
import Deasyncify from 'deasyncify';

export async function isHealthy(pg: Knex) {
  const [, err] = await Deasyncify.watch(async () => pg.raw('select now()'));

  if (err != null) {
    throw new Error('postgres is not ready');
  }
}

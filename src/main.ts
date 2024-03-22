import 'module-alias/register';
import 'reflect-metadata';
import './http/controllers';

import * as http from 'http';
import { MODULE_TOKENS, OPTIONS_TOKENS, SERVICE_TOKENS } from '@app/config/ioc';
import { Container } from 'inversify';
import { Env } from '@app/internal/env';
import envValidator from '@app/internal/env/env.validator';
import { postgresFactory } from '@app/config/postgres';
import { Knex } from 'knex';
import { Repository } from '@app/internal/postgres/repository';
import { Jwt, JwtOptions } from '@app/modules/jwt';
import { UserService } from '@app/services/user/user.service';
import { App } from './app';
import { isHealthy } from '@app/config/health';
import { Logger } from '@app/internal/logger';
import { defaultSerializers } from '@app/internal/logger/serializers';

export async function bootstrap() {
  const container = new Container();

  const logger = new Logger({ name: 'eis', serializers: defaultSerializers() });

  container.bind<Logger>(MODULE_TOKENS.Logger).toConstantValue(logger);

  container.bind<Env>(MODULE_TOKENS.Env).to(Env);

  const env = container.get<Env>(MODULE_TOKENS.Env);

  env.load(envValidator);

  const pg = await postgresFactory(env, logger);

  container.bind<Knex>(MODULE_TOKENS.KnexClient).toConstantValue(pg);

  container.bind<Repository>(MODULE_TOKENS.Repository).to(Repository);

  container
    .bind<JwtOptions>(OPTIONS_TOKENS.JwtOptions)
    .toConstantValue({ secret: 'myCat@11' });
  container.bind<Jwt>(MODULE_TOKENS.Jwt).to(Jwt);

  container.bind<UserService>(SERVICE_TOKENS.UserService).to(UserService);

  const app = new App(container, logger, () => isHealthy(pg));

  const httpServer = http.createServer(app.server.build());

  httpServer.listen(env.get<string>('PORT'));

  httpServer.on('listening', () => {
    logger.log(`listening on port ${env.get<string>('PORT')}`);
  });

  process.on('SIGTERM', async () => {
    logger.log('exiting application...');

    httpServer.close(() => {
      process.exit(0);
    });
  });
}

bootstrap();

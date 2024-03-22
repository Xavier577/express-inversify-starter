import 'reflect-metadata';

import { App } from '../../src/app';
import { Container } from 'inversify';
import request from 'supertest';
import { Env } from '../../src/internal/env';
import { MODULE_TOKENS } from '../../src/config/ioc';
import envValidator from '../../src/internal/env/env.validator';
import { Logger } from '../../src/internal/logger';
import { defaultSerializers } from '../../src/internal/logger/serializers';

const container = new Container();

const logger = new Logger({ name: 'eis', serializers: defaultSerializers() });

container.bind<Env>(MODULE_TOKENS.Env).to(Env);

const env = container.get<Env>(MODULE_TOKENS.Env);

env.load(envValidator);

const app = new App(container, logger).server.build();

describe('[GET] Health checker', () => {
  it('should successfully query the health checker', async () => {
    return request(app).get('/api/health').expect(200);
  });
});

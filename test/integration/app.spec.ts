import 'reflect-metadata';

import { App } from '../../src/app';
import { Container } from 'inversify';
import request from 'supertest';
import { Env } from '../../src/internal/env';
import { MODULE_TOKENS } from '../../src/config/ioc';
import envValidator from '../../src/internal/env/env.validator';

const container = new Container();

container.bind<Env>(MODULE_TOKENS.Env).to(Env);

const env = container.get<Env>(MODULE_TOKENS.Env);

env.load(envValidator);

const app = new App(container, console).server.build();

describe('[GET] Health checker', () => {
  it('should successfully query the health checker', async () => {
    return request(app).get('/api/health').expect(200);
  });
});

import * as Joi from 'joi';
import { AppEnv } from '@app/internal/enums';

export default Joi.object({
  DATABASE_RETRY: Joi.number().default(3),

  DATABASE_SSL: Joi.boolean().default(false),

  KNEX_DEBUG: Joi.bool().when('NODE_ENV', {
    is: Joi.bool().valid(AppEnv.DEVELOPMENT),
    then: Joi.bool().default(true),
    otherwise: Joi.bool().default(false),
  }),

  NODE_ENV: Joi.string()
    .valid(AppEnv.DEVELOPMENT, AppEnv.TEST, AppEnv.STAGING, AppEnv.PRODUCTION)
    .default(AppEnv.DEVELOPMENT),

  PORT: Joi.number().default(8000),

  REDIS_URL: Joi.string().required(),

  PG_HOST: Joi.string().required(),
  PG_PORT: Joi.string().required(),
  PG_USER: Joi.string().required(),
  PG_PASSWORD: Joi.string().required(),
  PG_DATABASE: Joi.string().required(),
});

import { DataValidationError, validate } from '@app/utils/joi-utils';
import * as process from 'process';
import { configDotenv } from 'dotenv';
import Joi from 'joi';
import { injectable } from 'inversify';

export class IncompleteEnvError extends Error {
  constructor(error: DataValidationError) {
    super(
      `Unable to load environment:\n${JSON.stringify(error.messages, null, 2)}`,
    );
  }
}

@injectable()
export class Env {
  private validatedEnv: any;

  public load<T>(schema: Joi.ObjectSchema<T>) {
    try {
      configDotenv();
      this.validatedEnv = validate(process.env, schema);
    } catch (err) {
      if (err instanceof DataValidationError) {
        throw new IncompleteEnvError(err);
      }
      throw err;
    }
  }

  public get<T = string>(key: string) {
    if (this.validatedEnv?.[key] != null) return this.validatedEnv[key] as T;

    return process.env[key] as T;
  }
}

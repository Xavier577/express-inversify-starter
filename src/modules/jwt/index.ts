import * as jwt from 'jsonwebtoken';
import { inject, injectable } from 'inversify';
import { OPTIONS_TOKENS } from '@app/config/ioc';

export interface JwtOptions {
  signOptions?: jwt.SignOptions;
  secret?: string | Buffer;
  publicKey?: string | Buffer;
  privateKey?: jwt.Secret;
  verifyOptions?: jwt.VerifyOptions;
}

export interface JwtSignOptions extends jwt.SignOptions {
  secret?: string | Buffer;
  privateKey?: jwt.Secret;
}

export interface JwtVerifyOptions extends jwt.VerifyOptions {
  secret?: string | Buffer;
  publicKey?: string | Buffer;
}

export type GetSecretKeyResult = string | Buffer | jwt.Secret;

@injectable()
export class Jwt {
  constructor(
    @inject(OPTIONS_TOKENS.JwtOptions) private readonly options: JwtOptions,
  ) {}

  sign(
    payload: string,
    options?: Omit<JwtSignOptions, keyof jwt.SignOptions>,
  ): string;
  sign(payload: Buffer | object, options?: JwtSignOptions): string;
  sign(payload: string | Buffer | object, options?: JwtSignOptions): string {
    const signOptions = this.mergeJwtOptions(
      { ...options },
      'signOptions',
    ) as jwt.SignOptions;

    const secret = this.getSecretKey(options, 'privateKey');

    const allowedSignOptKeys = ['secret', 'privateKey'];

    const signOptKeys = Object.keys(signOptions);
    if (
      typeof payload === 'string' &&
      signOptKeys.some((k) => !allowedSignOptKeys.includes(k))
    ) {
      throw new Error(
        'Payload as string is not allowed with the following sign options: ' +
          signOptKeys.join(', '),
      );
    }

    return jwt.sign(payload, secret, signOptions);
  }

  signAsync(
    payload: string,
    options?: Omit<JwtSignOptions, keyof jwt.SignOptions>,
  ): Promise<string>;
  signAsync(
    payload: Buffer | object,
    options?: JwtSignOptions,
  ): Promise<string>;
  signAsync(
    payload: string | Buffer | object,
    options?: JwtSignOptions,
  ): Promise<string> {
    const signOptions = this.mergeJwtOptions(
      { ...options },
      'signOptions',
    ) as jwt.SignOptions;
    const secret = this.getSecretKey(options, 'privateKey');

    const allowedSignOptKeys = ['secret', 'privateKey'];
    const signOptKeys = Object.keys(signOptions);
    if (
      typeof payload === 'string' &&
      signOptKeys.some((k) => !allowedSignOptKeys.includes(k))
    ) {
      throw new Error(
        'Payload as string is not allowed with the following sign options: ' +
          signOptKeys.join(', '),
      );
    }

    return new Promise((resolve, reject) =>
      Promise.resolve()
        .then(() => secret)
        .then((scrt: GetSecretKeyResult) => {
          jwt.sign(payload, scrt, signOptions, (err, encoded) =>
            err ? reject(err) : resolve(encoded),
          );
        }),
    );
  }

  verify<T extends object = any>(token: string, options?: JwtVerifyOptions): T {
    const verifyOptions = this.mergeJwtOptions({ ...options }, 'verifyOptions');

    const secret = this.getSecretKey(options, 'publicKey');

    return jwt.verify(token, secret, verifyOptions) as T;
  }

  verifyAsync<T extends object = any>(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<T> {
    const verifyOptions = this.mergeJwtOptions({ ...options }, 'verifyOptions');
    const secret = this.getSecretKey(options, 'publicKey');

    return new Promise((resolve, reject) =>
      Promise.resolve()
        .then(() => secret)
        .then((scrt: GetSecretKeyResult) => {
          jwt.verify(token, scrt, verifyOptions, (err, decoded) =>
            err ? reject(err) : resolve(decoded as T),
          );
        })
        .catch(reject),
    ) as Promise<T>;
  }

  decode<T = any>(token: string, options?: jwt.DecodeOptions): T {
    return jwt.decode(token, options) as T;
  }

  private mergeJwtOptions(
    options: JwtVerifyOptions | JwtSignOptions,
    key: 'verifyOptions' | 'signOptions',
  ): jwt.VerifyOptions | jwt.SignOptions {
    delete options.secret;
    if (key === 'signOptions') {
      delete (options as JwtSignOptions).privateKey;
    } else {
      delete (options as JwtVerifyOptions).publicKey;
    }
    return options
      ? {
          ...(this.options[key] || {}),
          ...options,
        }
      : this.options[key];
  }

  private getSecretKey(
    options: JwtVerifyOptions | JwtSignOptions,
    key: 'publicKey' | 'privateKey',
  ): GetSecretKeyResult {
    return (
      options?.secret ||
      this.options?.secret ||
      (key === 'privateKey'
        ? (options as JwtSignOptions)?.privateKey || this.options.privateKey
        : (options as JwtVerifyOptions)?.publicKey || this.options.publicKey) ||
      this.options[key]
    );
  }
}

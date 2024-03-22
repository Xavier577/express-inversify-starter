export const SERVICE_TOKENS = {
  UserService: Symbol.for('UserService'),
};

export const MODULE_TOKENS = {
  Jwt: Symbol.for('Jwt'),
  Env: Symbol.for('Env'),
  Repository: Symbol.for('Repository'),
  KnexClient: Symbol.for('KnexClient'),
  Logger: Symbol.for('Logger'),
};

export const OPTIONS_TOKENS = {
  JwtOptions: Symbol.for('JwtOptions'),
};

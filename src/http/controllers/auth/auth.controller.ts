import { controller, httpPost } from 'inversify-express-utils';
import { inject } from 'inversify';
import { Jwt } from '@app/modules/jwt';
import { MODULE_TOKENS } from '@app/config/ioc';

@controller('/auth')
export class AuthController {
  constructor(@inject(MODULE_TOKENS.Jwt) private readonly jwt: Jwt) {}

  @httpPost('/login')
  public async login() {
    const access_token = await this.jwt.signAsync(
      {
        id: 'xxx-xxx-xxx',
        role: 'USER',
      },
      { expiresIn: 5 * 60 * 1_000 },
    );

    return { access_token };
  }
}

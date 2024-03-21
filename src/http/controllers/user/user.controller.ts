import {
  controller,
  httpGet,
  httpPost,
  requestBody,
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { CreateUserData, UserService } from '@app/services/user/user.service';
import { SERVICE_TOKENS } from '@app/config/ioc';
import { autoValidate } from '@app/http/middlewares/validation.middleware';
import { CreateUserDto } from './dtos/create-user.dto';

@controller('/user')
export class UserController {
  constructor(
    @inject(SERVICE_TOKENS.UserService)
    private readonly userService: UserService,
  ) {}

  @httpGet('/')
  public async getUser() {
    return this.userService.getById('xxx-xxx-xxx');
  }

  @httpPost('/', autoValidate(CreateUserDto))
  public async createUser(@requestBody() body: CreateUserData) {
    const newUser = await this.userService.create(body);

    return { newUser };
  }
}

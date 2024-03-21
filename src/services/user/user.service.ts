import { inject, injectable } from 'inversify';
import { MODULE_TOKENS } from '@app/config/ioc';
import { Repository } from '@app/internal/postgres/repository';
import { User } from './entities/user.entity';

export type CreateUserData = Partial<
  Omit<User, 'id' | 'created_at' | 'updated_at'>
>;

@injectable()
export class UserService {
  private readonly qb = this.repo.createBuilder('users');

  constructor(
    @inject(MODULE_TOKENS.Repository) private readonly repo: Repository<User>,
  ) {}

  public async getById(id: string): Promise<User> {
    return this.qb().where({ id }).first('*');
  }

  public async create(data: CreateUserData): Promise<User> {
    return this.qb()
      .insert(data)
      .returning('*')
      .then(([user]) => user);
  }
}

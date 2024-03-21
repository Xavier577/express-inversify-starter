import { BaseEntity } from '@app/internal/postgres/base.entity';

export class User extends BaseEntity<User> {
  email: string;
  email_verified: boolean;
  phone_number: string;
  phone_number_verified: boolean;
}

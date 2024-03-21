import Joi from 'joi';

export const CreateUserDto = Joi.object().keys({
  email: Joi.string().required(),
  phone_number: Joi.string().required(),
});

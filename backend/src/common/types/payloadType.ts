import { RolesEnum } from '../enums/roles.enum';

export type payloadType = {
  sub: string;
  email: string;
  role: RolesEnum;
};

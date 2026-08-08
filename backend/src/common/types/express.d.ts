import { payloadType } from './payloadType';

declare global {
  namespace Express {
    interface User extends payloadType {}
  }
}

export {};

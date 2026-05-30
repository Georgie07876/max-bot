import 'express-session';

declare module 'express-session' {
  interface SessionData {
    role: 'admin' | 'superAdmin';
    username: string;
  }
}

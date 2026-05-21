export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'superAdmin';
  createdAt: string;
}

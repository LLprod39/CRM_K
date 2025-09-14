import { User, AuthUser, LoginData } from '../entities/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: number, data: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
  findAll(): Promise<User[]>;
  validateCredentials(loginData: LoginData): Promise<AuthUser | null>;
}

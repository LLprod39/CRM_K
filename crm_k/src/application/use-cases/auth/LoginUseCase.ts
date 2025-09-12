import { IUserRepository } from '../../../domain/repositories';
import { AuthUser, LoginData } from '../../../domain/entities';

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(loginData: LoginData): Promise<AuthUser | null> {
    return this.userRepository.validateCredentials(loginData);
  }
}

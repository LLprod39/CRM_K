import { IStudentRepository } from '../../../domain/repositories';

export class DeleteStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(id: number): Promise<void> {
    return this.studentRepository.delete(id);
  }
}

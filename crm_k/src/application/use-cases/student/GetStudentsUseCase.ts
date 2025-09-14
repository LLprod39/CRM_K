import { IStudentRepository } from '../../../domain/repositories';
import { Student } from '../../../domain/entities';

export class GetStudentsUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(userId?: number): Promise<Student[]> {
    if (userId) {
      return this.studentRepository.findByUserId(userId);
    }
    return this.studentRepository.findAll();
  }
}

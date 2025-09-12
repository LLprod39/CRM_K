import { IStudentRepository } from '../../../domain/repositories';
import { Student, UpdateStudentData } from '../../../domain/entities';

export class UpdateStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(data: UpdateStudentData): Promise<Student> {
    return this.studentRepository.update(data);
  }
}

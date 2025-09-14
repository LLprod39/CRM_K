import { IStudentRepository } from '../../../domain/repositories';
import { Student, CreateStudentData } from '../../../domain/entities';

export class CreateStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(data: CreateStudentData): Promise<Student> {
    return this.studentRepository.create(data);
  }
}

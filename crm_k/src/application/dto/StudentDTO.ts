export interface StudentDTO {
  id: number;
  fullName: string;
  phone: string;
  age: number;
  parentName: string;
  diagnosis?: string;
  comment?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDTO {
  fullName: string;
  phone: string;
  age: number;
  parentName: string;
  diagnosis?: string;
  comment?: string;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  id: number;
}

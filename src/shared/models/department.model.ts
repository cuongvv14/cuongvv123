export interface Department {
  id?: number; // `id` có thể không tồn tại khi tạo mới chi nhánh
  departmentName: string;
  level: number;
  isActive?: boolean; // `isActive` là trường optional
  createdAt?: Date; // Các trường không bắt buộc
  updatedAt?: Date;
  deletedAt?: Date | null;
}

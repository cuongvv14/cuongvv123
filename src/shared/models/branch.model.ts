export interface Branch {
    id?: number;  // `id` có thể không tồn tại khi tạo mới chi nhánh
    branchName: string;
    province: string;
    district: string;
    ward: string;
    specificAddress: string;
    email: string;
    phoneNumber: string;
    taxCode: string;
    isActive?: boolean;   // `isActive` là trường optional
    createdAt?: Date;     // Các trường không bắt buộc
    updatedAt?: Date;
    deletedAt?: Date | null;
}

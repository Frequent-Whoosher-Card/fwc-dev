import axiosInstance from "../axios";

export interface EmployeeType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeTypeCreatePayload {
  code: string;
  name: string;
  description?: string;
}

export interface EmployeeTypeUpdatePayload {
  code?: string;
  name?: string;
  description?: string | null;
}

export interface EmployeeTypeListResponse {
  success: boolean;
  data: EmployeeType[];
}

export interface EmployeeTypeDetailResponse {
  success: boolean;
  data: EmployeeType;
}

/**
 * Get all employee types (with pagination)
 */
export async function getEmployeeTypes(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<EmployeeTypeListResponse> {
  const response = await axiosInstance.get("/employee-types", { params });
  return response.data;
}

/**
 * Get employee type by ID
 */
export async function getEmployeeTypeById(
  id: string,
): Promise<EmployeeTypeDetailResponse> {
  const response = await axiosInstance.get(`/employee-types/${id}`);
  return response.data;
}

/**
 * Create new employee type
 */
export async function createEmployeeType(
  payload: EmployeeTypeCreatePayload,
): Promise<EmployeeTypeDetailResponse> {
  const response = await axiosInstance.post("/employee-types", payload);
  return response.data;
}

/**
 * Update employee type
 */
export async function updateEmployeeType(
  id: string,
  payload: EmployeeTypeUpdatePayload,
): Promise<EmployeeTypeDetailResponse> {
  const response = await axiosInstance.put(`/employee-types/${id}`, payload);
  return response.data;
}

/**
 * Delete employee type (soft delete)
 */
export async function deleteEmployeeType(id: string): Promise<void> {
  await axiosInstance.delete(`/employee-types/${id}`);
}

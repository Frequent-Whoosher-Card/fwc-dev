import axiosInstance from "../axios";

export interface PaymentMethod {
  id: string;
  name: string;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface PaymentMethodCreatePayload {
  name: string;
  notes?: string;
}

export interface PaymentMethodUpdatePayload {
  name?: string;
  notes?: string | null;
}

export interface PaymentMethodListResponse {
  success: boolean;
  data: PaymentMethod[];
}

export interface PaymentMethodDetailResponse {
  success: boolean;
  data: PaymentMethod;
}

export async function getPaymentMethods(): Promise<PaymentMethodListResponse> {
  const response = await axiosInstance.get("/payment-methods");
  return response.data;
}

export async function getPaymentMethodById(
  id: string,
): Promise<PaymentMethodDetailResponse> {
  const response = await axiosInstance.get(`/payment-methods/${id}`);
  return response.data;
}

export async function createPaymentMethod(
  payload: PaymentMethodCreatePayload,
): Promise<PaymentMethodDetailResponse> {
  const response = await axiosInstance.post("/payment-methods", payload);
  return response.data;
}

export async function updatePaymentMethod(
  id: string,
  payload: PaymentMethodUpdatePayload,
): Promise<PaymentMethodDetailResponse> {
  const response = await axiosInstance.put(`/payment-methods/${id}`, payload);
  return response.data;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await axiosInstance.delete(`/payment-methods/${id}`);
}

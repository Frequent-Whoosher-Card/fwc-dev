export interface CardProduct {
  id: string;
  categoryId: string;
  typeId: string;
  price: string;
  masaBerlaku: number;
  totalQuota: number;
  category: {
    id: string;
    categoryName: string;
  };
  type: {
    id: string;
    typeName: string;
  };
}

export interface Card {
  id: string;
  serialNumber: string;
  status: string;
  cardProductId: string;
}

export interface CreateMemberPageProps {
  /** FWC atau VOUCHER, dari tab yang dipilih di halaman transaksi (query ?programType=) */
  programType?: "FWC" | "VOUCHER";
}

export type CreateMemberInputMode = "" | "manual" | "recommendation" | "range";

export type ManualSerialResult = "available" | "unavailable" | "not_found" | null;

export interface CreateMemberFormState {
  name: string;
  nik: string;
  nippKai: string;
  employeeTypeId: string;
  nationality: string;
  phone: string;
  gender: string;
  birthDate: string;
  email: string;
  address: string;
  cityId: string;
  companyName: string;
  membershipDate: string;
  expiredDate: string;
  purchasedDate: string;
  price: string;
  cardProductId: string;
  station: string;
  shiftDate: string;
  serialNumber: string;
  edcReferenceNumber: string;
  paymentMethodId: string;
}

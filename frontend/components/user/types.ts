export interface User {
  id: string;
  fullname: string;
  nip: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  roleLabel: string;
  station: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

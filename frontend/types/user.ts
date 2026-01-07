export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: {
    roleCode: string;
    roleName: string;
  };
}

/**
 * Custom hook untuk mengatur permission akses fitur Redeem berdasarkan role
 * 
 * Hak akses:
 * - Tambah redeem: semua role (superadmin, xxxadmin, supervisor, petugas)
 * - Hapus redeem: semua kecuali petugas
 * - Filter & search: semua
 * - List redeem: semua
 * - Export report: xxxhanya petugas, semua
 * - Edit redeem: DIHILANGKAN (deprecated)
 * - Last redeem: (supervisor, petugas, superadmin)
 */

export type UserRole = 'superadmin' | 'admin' | 'supervisor' | 'petugas';

export interface RedeemPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canFilter: boolean;
  canList: boolean;
  canExport: boolean;
  canViewDetails: boolean;
  canUploadLastDoc: boolean;
}

export function useRedeemPermission(role?: UserRole): RedeemPermissions {
  if (!role) {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canFilter: false,
      canList: false,
      canExport: false,
      canViewDetails: false,
      canUploadLastDoc: false,
    };
  }

  return {
    // Tambah redeem: semua role
    canCreate: ['superadmin', 'admin', 'supervisor', 'petugas'].includes(role),
    canEdit: false,
    canDelete: role !== 'petugas',
    canFilter: true,
    canList: true,
    // Export: semua role
    canExport: ['superadmin', 'admin', 'supervisor', 'petugas'].includes(role),
    canViewDetails: true,
    canUploadLastDoc: true,
  };
}

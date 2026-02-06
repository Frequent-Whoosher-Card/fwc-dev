import { API_BASE_URL } from '../apiConfig';

export interface MenuItem {
  label: string;
  route: string | null;
  icon: string | null;
  children?: MenuItem[];
}

export interface PermissionData {
  success: boolean;
  message: string;
  data: {
    menu: MenuItem[];
    permissions: string[];
  };
}

/**
 * Fetch user's accessible menu based on their role permissions
 * GET /users/me/menu
 */
export async function getUserMenu(): Promise<PermissionData> {
  const token = localStorage.getItem('fwc_token');

  if (!token) {
    throw new Error('No auth token');
  }

  const res = await fetch(`${API_BASE_URL}/users/me/menu`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Failed to fetch menu');
  }

  return res.json();
}

/**
 * Extract all permission codes from menu structure (deprecated - use response.data.permissions)
 */
export function extractPermissions(menuItems: MenuItem[]): string[] {
  const permissions: string[] = [];

  function traverse(items: MenuItem[]) {
    items.forEach(item => {
      // Extract permission from route (e.g., "/dashboard/redeem" -> "redeem")
      if (item.route) {
        const parts = item.route.split('/').filter(Boolean);
        const module = parts[parts.length - 1];
        permissions.push(module);
      }
      
      if (item.children) {
        traverse(item.children);
      }
    });
  }

  traverse(menuItems);
  return [...new Set(permissions)]; // Remove duplicates
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}

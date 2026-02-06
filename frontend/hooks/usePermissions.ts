import { useEffect, useState } from 'react';
import { getUserMenu } from '@/lib/services/permission.service';

/**
 * Simple hook to get user permissions from backend
 * Usage: const permissions = usePermissions();
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await getUserMenu();
        setPermissions(data.data.permissions);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  return { permissions, loading };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: string[], permissions: string[]): boolean {
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {
  return permissions.every(p => userPermissions.includes(p));
}

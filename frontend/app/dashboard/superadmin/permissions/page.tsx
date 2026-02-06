"use client";

import { useEffect, useState } from "react";
import { PermissionGroup, PermissionService } from "@/lib/services/permissionService";
import { Role, RoleService } from "@/lib/services/roleService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function PermissionMatrixPage() {
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState<PermissionGroup[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    // Matrix: RoleID -> Set of Permission IDs
    const [matrix, setMatrix] = useState<Record<string, Set<string>>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all permissions (grouped)
            const perms = await PermissionService.getAllGrouped();
            setPermissions(perms);

            // 2. Fetch all roles
            const roleList = await RoleService.getAll();
            setRoles(roleList);

            // 3. Fetch permissions for each role
            const matrixData: Record<string, Set<string>> = {};

            await Promise.all(
                roleList.map(async (role) => {
                    try {
                        const rolePerms = await RoleService.getPermissions(role.id);
                        matrixData[role.id] = new Set(rolePerms);
                    } catch (e) {
                        console.error(`Failed to fetch permissions for role ${role.roleName}`, e);
                        matrixData[role.id] = new Set();
                    }
                })
            );

            setMatrix(matrixData);
        } catch (error) {
            console.error("Error fetching matrix data:", error);
            toast.error("Gagal memuat data permission matrix");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (roleId: string, permissionId: string, checked: boolean) => {
        setMatrix((prev) => {
            const newSet = new Set(prev[roleId]);
            if (checked) {
                newSet.add(permissionId);
            } else {
                newSet.delete(permissionId);
            }
            return { ...prev, [roleId]: newSet };
        });
    };

    const handleToggleModule = (roleId: string, modulePermissions: string[], checked: boolean) => {
        setMatrix((prev) => {
            const newSet = new Set(prev[roleId]);
            modulePermissions.forEach(pid => {
                if (checked) {
                    newSet.add(pid);
                } else {
                    newSet.delete(pid);
                }
            });
            return { ...prev, [roleId]: newSet };
        });
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            // Save all roles
            await Promise.all(
                roles.map(async (role) => {
                    const permissionIds = Array.from(matrix[role.id] || []);
                    await RoleService.updatePermissions(role.id, permissionIds);
                })
            );
            
            toast.success("Permission berhasil disimpan! Halaman akan di-refresh...");
            
            // Wait for toast to show, then reload to refresh sidebar menu
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error("Error saving permissions:", error);
            toast.error("Gagal menyimpan perubahan");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Permission Management</h1>
                    <p className="text-sm text-gray-500">
                        Atur hak akses untuk setiap role aplikasi
                    </p>
                </div>
                <Button onClick={saveChanges} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Perubahan
                        </>
                    )}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Matrix Akses</CardTitle>
                    <CardDescription>Centang kotak untuk memberikan akses ke modul/action tertentu.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Module / Permission</TableHead>
                                    {roles.map((role) => (
                                        <TableHead key={role.id} className="text-center min-w-[100px]">
                                            {role.roleName
                                                .toLowerCase()
                                                .split(' ')
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ')}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* SELECT ALL ROW */}
                                <TableRow className="bg-gray-100 hover:bg-gray-200 border-b-2 border-gray-300">
                                    <TableCell className="font-bold">Select All</TableCell>
                                    {roles.map((role) => {
                                        const rolePerms = matrix[role.id];
                                        const allPermissionIds = permissions.flatMap(g => g.permissions.map(p => p.id));
                                        const allChecked = allPermissionIds.length > 0 && allPermissionIds.every(id => rolePerms?.has(id));
                                        const someChecked = allPermissionIds.some(id => rolePerms?.has(id));

                                        const handleToggleRole = (checked: boolean) => {
                                            setMatrix((prev) => {
                                                const newSet = new Set(prev[role.id]);
                                                if (checked) {
                                                    allPermissionIds.forEach(id => newSet.add(id));
                                                } else {
                                                    allPermissionIds.forEach(id => newSet.delete(id));
                                                }
                                                return { ...prev, [role.id]: newSet };
                                            });
                                        };

                                        return (
                                            <TableCell key={`select-all-${role.id}`} className="text-center">
                                                <Checkbox
                                                    checked={allChecked ? true : (someChecked ? "indeterminate" : false)}
                                                    onCheckedChange={(checked) => handleToggleRole(checked as boolean)}
                                                    aria-label={`Select all permissions for ${role.roleName}`}
                                                    className="border-gray-500 data-[state=checked]:bg-gray-700 data-[state=checked]:border-gray-700"
                                                />
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>

                                {permissions.map((group) => (
                                    <>
                                        {/* Module Header Row */}
                                        <TableRow key={group.module} className="bg-gray-50 hover:bg-gray-100">
                                            <TableCell className="font-semibold capitalize">
                                                {group.module.replace(/\./g, " ")}
                                            </TableCell>
                                            {roles.map((role) => {
                                                const rolePerms = matrix[role.id];
                                                const groupIds = group.permissions.map(p => p.id);
                                                const allChecked = groupIds.every(id => rolePerms?.has(id));
                                                const someChecked = groupIds.some(id => rolePerms?.has(id));

                                                return (
                                                    <TableCell key={`${role.id}-${group.module}`} className="text-center">
                                                        <Checkbox
                                                            checked={allChecked ? true : (someChecked ? "indeterminate" : false)}
                                                            onCheckedChange={(checked) => handleToggleModule(role.id, groupIds, checked as boolean)}
                                                            aria-label={`Toggle all ${group.module} for ${role.roleName}`}
                                                            className="border-gray-400"
                                                        />
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>

                                        {/* Permission Rows */}
                                        {group.permissions.map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell className="pl-6 text-sm text-gray-600">
                                                    <div className="flex flex-col">
                                                        <span>{perm.actionName}</span>
                                                    </div>
                                                </TableCell>
                                                {roles.map((role) => {
                                                    return (
                                                        <TableCell key={`${role.id}-${perm.id}`} className="text-center">
                                                            <Checkbox
                                                                checked={matrix[role.id]?.has(perm.id)}
                                                                onCheckedChange={(checked) => handleToggle(role.id, perm.id, checked as boolean)}
                                                                className="border-gray-400"
                                                            />
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

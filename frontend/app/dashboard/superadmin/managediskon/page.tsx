"use client";

import ConfirmModal from "@/components/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDiscount } from "@/hooks/useDiscount";
import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

export default function ManageDiskonPage() {
  const {
    rules,
    loading,
    isAdding,
    setIsAdding,
    newRule,
    setNewRule,
    editingId,
    editForm,
    setEditForm,
    create,
    update,
    startEdit,
    cancelEdit,
    deletingId,
    startDelete,
    confirmDelete,
    cancelDelete,
  } = useDiscount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Diskon Grosir</h1>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={loading || isAdding}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Aturan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview Perhitungan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p className="font-semibold">Cara kerja diskon:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>
                    Diskon diterapkan berdasarkan total jumlah item dalam
                    keranjang.
                  </li>
                  <li>Aturan dievaluasi dari jumlah terbesar ke terkecil.</li>
                  <li>
                    Jika jumlah item memenuhi syarat minimum, diskon tersebut
                    yang akan digunakan.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Aturan Aktif:</h3>
                {rules.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Belum ada aturan diskon.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex flex-col gap-1 rounded border p-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {rule.minQuantity} - {rule.maxQuantity || "∞"} pcs
                          </span>
                          <span className="font-bold text-green-600">
                            Diskon {Number(rule.discount)}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rule.roleAccess && rule.roleAccess.length > 0 ? (
                            rule.roleAccess.map((role) => (
                              <span
                                key={role}
                                className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase font-medium text-gray-600"
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              Semua Role (Default)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form / List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Aturan</CardTitle>
            {!loading && rules.length > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                Gunakan rentang quantity yang belum terdaftar untuk menghindari
                bentrok.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Min. Qty</TableHead>
                  <TableHead>Max. Qty</TableHead>
                  <TableHead>Diskon (%)</TableHead>
                  <TableHead>Role Access</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Form Tambah Baru */}
                {isAdding && (
                  <TableRow className="bg-muted/50 align-top">
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={newRule.minQuantity ?? ""}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            minQuantity:
                              e.target.valueAsNumber || e.target.value,
                          })
                        }
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={newRule.maxQuantity ?? ""}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            maxQuantity:
                              e.target.value === ""
                                ? null
                                : e.target.valueAsNumber || e.target.value,
                          })
                        }
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="%"
                        value={newRule.discount ?? ""}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            discount: e.target.valueAsNumber || e.target.value,
                          })
                        }
                        className="h-8 w-16"
                      />
                    </TableCell>
                    <TableCell>
                      <MultiSelect
                        value={newRule.roleAccess}
                        onChange={(val) =>
                          setNewRule({ ...newRule, roleAccess: val })
                        }
                        options={[
                          { id: "1", name: "Superadmin", code: "superadmin" },
                          { id: "2", name: "Admin", code: "admin" },
                          { id: "3", name: "Supervisor", code: "supervisor" },
                          { id: "4", name: "Petugas", code: "petugas" },
                        ]}
                        placeholder="Pilih Role"
                      />
                      {newRule.roleAccess.length === 0 && (
                        <span className="text-[10px] text-red-500 ml-1">
                          Wajib diisi
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => create()}
                          disabled={loading || newRule.roleAccess.length === 0}
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsAdding(false)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Daftar Rules */}
                {rules.map((rule) => {
                  const isEditing = editingId === rule.id;

                  if (isEditing && editForm) {
                    return (
                      <TableRow
                        key={rule.id}
                        className="bg-blue-50/50 align-top"
                      >
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.minQuantity ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                minQuantity:
                                  e.target.valueAsNumber || e.target.value,
                              })
                            }
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.maxQuantity ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                maxQuantity:
                                  e.target.value === ""
                                    ? null
                                    : e.target.valueAsNumber || e.target.value,
                              })
                            }
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={editForm.discount ?? ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                discount:
                                  e.target.valueAsNumber || e.target.value,
                              })
                            }
                            className="h-8 w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <MultiSelect
                            value={editForm.roleAccess}
                            onChange={(val) =>
                              setEditForm({ ...editForm, roleAccess: val })
                            }
                            options={[
                              {
                                id: "1",
                                name: "Superadmin",
                                code: "superadmin",
                              },
                              { id: "2", name: "Admin", code: "admin" },
                              {
                                id: "3",
                                name: "Supervisor",
                                code: "supervisor",
                              },
                              { id: "4", name: "Petugas", code: "petugas" },
                            ]}
                            placeholder="Pilih Role"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => update(rule.id)}
                              disabled={
                                loading || editForm.roleAccess.length === 0
                              }
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.minQuantity}</TableCell>
                      <TableCell>{rule.maxQuantity || "∞"}</TableCell>
                      <TableCell>{Number(rule.discount)}%</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(rule.roleAccess || []).length > 0 ? (
                            rule.roleAccess?.map((r) => (
                              <span
                                key={r}
                                className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize border"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No roles
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(rule)}
                            disabled={loading || isAdding}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startDelete(rule.id)}
                            disabled={loading}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!loading && rules.length === 0 && !isAdding && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Tidak ada aturan diskon
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        open={!!deletingId}
        title="Hapus Aturan Diskon"
        description="Apakah Anda yakin ingin menghapus aturan diskon ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={loading}
      />
    </div>
  );
}

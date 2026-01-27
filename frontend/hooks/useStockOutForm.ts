"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import stockService from "@/lib/services/stock.service";
import toast from "react-hot-toast";

interface Category {
  id: string;
  categoryName: string;
}

interface TypeItem {
  id: string;
  typeName: string;
}

interface Station {
  id: string;
  stationName: string;
}

interface UseStockOutFormProps {
  programType: "FWC" | "VOUCHER";
  id?: string; // If provided, we are in edit mode
}

export const useStockOutForm = ({ programType, id }: UseStockOutFormProps) => {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [form, setForm] = useState({
    movementAt: today,
    cardCategoryId: "",
    cardTypeId: "",
    stationId: "",
    quantity: "",
    startSerial: "",
    endSerial: "",
    note: "",
    batchId: "",
    notaDinas: "",
    bast: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catList, typeList, stationList] = await Promise.all([
        stockService.getCategories(),
        stockService.getTypes(),
        stockService.getStations(),
      ]);

      setCategories(catList);
      setTypes(typeList);
      setStations(stationList);

      if (id) {
        const detail = await stockService.getStockOutById(id);
        setStatus(detail.status);
        setForm({
          movementAt: detail.movementAt
            ? new Date(detail.movementAt).toISOString().split("T")[0]
            : today,
          cardCategoryId: "", // Detail response usually has name, not id unless expanded
          cardTypeId: "",
          stationId: "", // Same as above
          quantity: String(detail.quantity || ""),
          startSerial: detail.sentSerialNumbers?.[0]
            ? detail.sentSerialNumbers[0].slice(-5).replace(/^0+/, "") || "0"
            : "",
          endSerial: detail.sentSerialNumbers?.[
            detail.sentSerialNumbers.length - 1
          ]
            ? detail.sentSerialNumbers[detail.sentSerialNumbers.length - 1]
                .slice(-5)
                .replace(/^0+/, "") || "0"
            : "",
          note: detail.note || "",
          batchId: detail.batchId || "",
          notaDinas: detail.notaDinas || "",
          bast: detail.bast || "",
        });
      }
    } catch (err) {
      toast.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [id, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    // Validation
    if (id && status !== "PENDING") {
      toast.error("Hanya transaksi PENDING yang dapat diubah");
      return;
    }

    const isEdit = !!id;
    const requiredFields = isEdit
      ? [form.movementAt, form.stationId, form.startSerial, form.endSerial]
      : [
          form.movementAt,
          form.cardCategoryId,
          form.cardTypeId,
          form.stationId,
          form.quantity,
        ];

    if (requiredFields.some((field) => !field)) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        movementAt: new Date(form.movementAt).toISOString(),
        stationId: form.stationId,
        note: form.note,
      };

      if (isEdit) {
        payload.startSerial = form.startSerial;
        payload.endSerial = form.endSerial;
        payload.batchId = form.batchId;
        payload.notaDinas = form.notaDinas;
        payload.bast = form.bast;
        await stockService.updateStockOut(id, payload);
        toast.success("Stock out berhasil diperbarui");
      } else {
        payload.cardCategoryId = form.cardCategoryId;
        payload.cardTypeId = form.cardTypeId;
        payload.quantity = Number(form.quantity);
        payload.programType = programType;
        payload.batchId = form.batchId;
        payload.notaDinas = form.notaDinas;
        payload.bast = form.bast;
        await stockService.createStockOut(payload);
        toast.success("Stock out berhasil dibuat");
      }

      router.push(
        `/dashboard/superadmin/stock/${programType.toLowerCase()}/out`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan stock out");
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    categories,
    types,
    stations,
    loading,
    saving,
    status,
    handleSubmit,
    isEdit: !!id,
    isEditable: !id || status === "PENDING",
  };
};

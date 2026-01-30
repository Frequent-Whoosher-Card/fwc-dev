"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import stockService from "@/lib/services/stock.service";
import toast from "react-hot-toast";

interface CardProduct {
  id: string;
  category?: {
    categoryName: string;
  };
  type?: {
    typeName: string;
  };
  isActive?: boolean;
}

interface UseStockInFormProps {
  programType: "FWC" | "VOUCHER";
}

export const useStockInForm = ({ programType }: UseStockInFormProps) => {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSerial, setLoadingSerial] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tanggal: today,
    productId: "",
    initialSerial: "",
    lastSerial: "",
  });

  const [maxAvailableSerial, setMaxAvailableSerial] = useState<string>("");
  const [fullStartSerial, setFullStartSerial] = useState<string>("");

  const fetchProducts = useCallback(async () => {
    try {
      const data = await stockService.getProducts(programType);
      setProducts(data);
    } catch (err) {
      toast.error("Gagal mengambil data card product");
    }
  }, [programType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchAvailableSerial = async (productId: string) => {
    try {
      setLoadingSerial(true);
      const data = await stockService.getAvailableSerials(
        productId,
        programType,
      );
      const startSerial = data?.startSerial;

      if (!startSerial) {
        setForm((prev) => ({
          ...prev,
          initialSerial: "",
          lastSerial: "",
        }));
        toast.error("Nomor Serial Belum Tersedia");
        return;
      }

      const lastFiveDigits = startSerial.slice(-5);
      const endSerialLastFive = data?.endSerial ? data.endSerial.slice(-5) : "";

      setMaxAvailableSerial(endSerialLastFive);
      setFullStartSerial(startSerial);

      setForm((prev) => ({
        ...prev,
        initialSerial: lastFiveDigits,
        lastSerial: "",
      }));
    } catch (err) {
      toast.error("Gagal mengambil available serial");
    } finally {
      setLoadingSerial(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.tanggal || !form.productId) {
      toast.error("Tanggal & product wajib diisi");
      return;
    }

    if (!form.initialSerial) {
      toast.error("Initial serial belum tersedia");
      return;
    }

    if (!form.lastSerial) {
      toast.error("Last serial wajib diisi");
      return;
    }

    const start = Number(form.initialSerial);
    const end = Number(form.lastSerial);

    if (isNaN(start) || isNaN(end)) {
      toast.error("Serial harus berupa angka");
      return;
    }

    if (end < start) {
      toast.error("Range serial tidak valid");
      return;
    }

    try {
      setSaving(true);

      // Extract serialDate if Voucher
      let serialDate: string | undefined;
      // Assuming structure ...YYMMDDxxxxx
      if (
        programType === "VOUCHER" &&
        fullStartSerial &&
        fullStartSerial.length >= 11
      ) {
        const datePart = fullStartSerial.slice(-11, -5); // YYMMDD
        if (/^\d{6}$/.test(datePart)) {
          const year = `20${datePart.slice(0, 2)}`;
          const month = datePart.slice(2, 4);
          const day = datePart.slice(4, 6);
          serialDate = `${year}-${month}-${day}T12:00:00`;
        }
      }

      await stockService.createStockIn({
        movementAt: new Date(form.tanggal).toISOString(),
        cardProductId: form.productId,
        startSerial: form.initialSerial.padStart(5, "0"),
        endSerial: form.lastSerial.padStart(5, "0"),
        note: "",
        programType,
        serialDate,
      });

      toast.success("Stock berhasil ditambahkan");
      router.push(
        `/dashboard/superadmin/stock/${programType.toLowerCase()}/in`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan stock");
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    products,
    loading,
    loadingSerial,
    saving,
    fetchAvailableSerial,
    handleSubmit,
    maxAvailableSerial,
  };
};

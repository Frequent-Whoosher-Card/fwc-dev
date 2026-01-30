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
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil data card product");
    }
  }, [programType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!form.productId) {
      setMaxAvailableSerial("");
      setFullStartSerial("");
    }
  }, [form.productId]);

  const fetchAvailableSerial = async (productId: string) => {
    // Always clear old data first
    setMaxAvailableSerial("");

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
        // Ensure max is also cleared here
        setMaxAvailableSerial("");
        toast.error("Nomor Serial Belum Tersedia");
        return;
      }

      setMaxAvailableSerial(data?.endSerial || "");
      setFullStartSerial(startSerial);

      setForm((prev) => ({
        ...prev,
        initialSerial: startSerial,
        lastSerial: "",
      }));
    } catch (err: any) {
      console.error("Failed to fetch available serials", err);
      setMaxAvailableSerial("");
      setForm((prev) => ({
        ...prev,
        initialSerial: "",
        lastSerial: "",
      }));
      toast.error(err.message || "Gagal mengambil data available serial");
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

    try {
      setSaving(true);

      // Extract serialDate if Voucher
      let serialDate: string | undefined;
      if (
        programType === "VOUCHER" &&
        form.initialSerial &&
        form.initialSerial.length >= 11
      ) {
        const datePart = form.initialSerial.slice(-11, -5); // YYMMDD
        if (/^\d{6}$/.test(datePart)) {
          const year = `20${datePart.slice(0, 2)}`;
          const month = datePart.slice(2, 4);
          const day = datePart.slice(4, 6);
          serialDate = `${year}-${month}-${day}T12:00:00`;
        }
      }

      const getSuffix = (serial: string) => {
        return serial.length > 5 ? serial.slice(-5) : serial.padStart(5, "0");
      };

      await stockService.createStockIn({
        movementAt: new Date(form.tanggal).toISOString(),
        cardProductId: form.productId,
        startSerial: getSuffix(form.initialSerial),
        endSerial: getSuffix(form.lastSerial),
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

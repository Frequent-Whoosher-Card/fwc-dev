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
    quantity: "",
    vendorName: "",
    vcrSettle: "",
    costs: "",
  });

  const [maxAvailableSerial, setMaxAvailableSerial] = useState<string>("");
  const [fullStartSerial, setFullStartSerial] = useState<string>("");

  /* New File State */
  const [vcrSettleFile, setVcrSettleFile] = useState<File | null>(null);

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
    // Reset secondary states when product changes
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
          quantity: "",
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
        quantity: "",
      }));
    } catch (err: any) {
      console.error("Failed to fetch available serials", err);
      setMaxAvailableSerial("");
      setForm((prev) => ({
        ...prev,
        initialSerial: "",
        lastSerial: "",
        quantity: "",
      }));
      toast.error(err.message || "Gagal mengambil data available serial");
    } finally {
      setLoadingSerial(false);
    }
  };

  // Calculate helpers
  const calculateEndSerial = (start: string, qty: number) => {
    const match = start.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numberPart = match[2];
      const startNum = parseInt(numberPart, 10);
      const endNum = startNum + qty - 1;
      return `${prefix}${String(endNum).padStart(numberPart.length, "0")}`;
    }
    return "";
  };

  const calculateQuantity = (start: string, end: string) => {
    const startMatch = start.match(/^(.*?)(\d+)$/);
    const endMatch = end.match(/^(.*?)(\d+)$/);
    if (startMatch && endMatch && startMatch[1] === endMatch[1]) {
      const startNum = parseInt(startMatch[2], 10);
      const endNum = parseInt(endMatch[2], 10);
      const diff = endNum - startNum + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const handleQuantityChange = (val: string) => {
    setForm((prev) => {
      let qty = parseInt(val);
      if (!isNaN(qty) && qty > 10000) {
        toast.error("Maksimal quantity adalah 10.000");
        qty = 10000;
        val = "10000";
      }

      let newEnd = prev.lastSerial;
      if (!isNaN(qty) && qty > 0 && prev.initialSerial) {
        newEnd = calculateEndSerial(prev.initialSerial, qty);
      } else {
        newEnd = "";
      }
      return { ...prev, quantity: val, lastSerial: newEnd };
    });
  };

  const handleEndSerialChange = (val: string) => {
    setForm((prev) => {
      let newQty = prev.quantity;
      if (val && prev.initialSerial) {
        // Handle if user only enters suffix
        const fullEnd =
          val.length <= 5 && prev.initialSerial.length > 5
            ? prev.initialSerial.slice(0, -5) + val.padStart(5, "0")
            : val;

        const qty = calculateQuantity(prev.initialSerial, fullEnd);

        if (qty > 10000) {
          toast.error("Maksimal quantity adalah 10.000");
        }

        newQty = qty > 0 ? String(qty) : "";
      } else {
        newQty = "";
      }
      return { ...prev, lastSerial: val, quantity: newQty };
    });
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
        vendorName: form.vendorName,
        vcrSettle: form.vcrSettle,
        costs: form.costs,
        vcrSettleFile: vcrSettleFile || undefined,
        programType,
        serialDate,
      });

      toast.success("Stock In berhasil disimpan");
      router.push("/dashboard/superadmin/stock/in");
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan stock");
    } finally {
      setSaving(false);
    }
  };

  // Check if last serial exceeds max available
  let isOverLimit = false;
  if (form.lastSerial && maxAvailableSerial) {
    const lastMatch = form.lastSerial.match(/^(.*?)(\d+)$/);
    const maxMatch = maxAvailableSerial.match(/^(.*?)(\d+)$/);

    if (lastMatch && maxMatch) {
      const lastNum = parseInt(lastMatch[2], 10);
      const maxNum = parseInt(maxMatch[2], 10);
      if (lastNum > maxNum) {
        isOverLimit = true;
      }
    }
  }

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
    handleQuantityChange,
    handleEndSerialChange,
    isOverLimit,
    vcrSettleFile, // [NEW]
    setVcrSettleFile, // [NEW]
  };
};

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import stockService from "@/lib/services/stock.service";
import toast from "react-hot-toast";

interface CardProduct {
  id: string;
  category?: {
    id: string;
    categoryName: string;
  };
  type?: {
    id: string;
    typeName: string;
  };
}

interface Station {
  id: string;
  stationName: string;
}

interface CategoryOption {
  id: string;
  categoryName: string;
}

interface TypeOption {
  id: string;
  typeName: string;
}

interface UseStockOutFormProps {
  programType: "FWC" | "VOUCHER";
  id?: string; // If provided, we are in edit mode
}

export const useStockOutForm = ({ programType, id }: UseStockOutFormProps) => {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [products, setProducts] = useState<CardProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [form, setForm] = useState({
    movementAt: today,
    productId: "",
    cardCategoryId: "",
    cardTypeId: "",
    categoryName: "",
    typeName: "",
    stationId: "",
    quantity: "",
    startSerial: "",
    endSerial: "",
    note: "",
    notaDinas: "",
    bast: "",
    notaDinasFile: null as File | null,
    bastFile: null as File | null,
    requesterName: "",
    receiverName: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productList, stationList, categoryList, typeList] =
        await Promise.all([
          stockService.getProducts(programType),
          stockService.getStations(),
          stockService.getCategories(),
          stockService.getTypes(),
        ]);

      setProducts(productList);
      setStations(stationList);
      setCategories(categoryList);
      setTypes(typeList);

      if (id) {
        const detail = await stockService.getStockOutById(id);
        setStatus(detail.status);

        // Find matching product to set productId so maxAvailableSerial works
        const product = productList.find(
          (p) =>
            p.category?.id === detail.cardCategory?.id &&
            p.type?.id === detail.cardType?.id,
        );

        setForm({
          movementAt: detail.movementAt
            ? new Date(detail.movementAt).toISOString().split("T")[0]
            : today,
          productId: product?.id || "",
          cardCategoryId: detail.cardCategory?.id || "",
          cardTypeId: detail.cardType?.id || "",
          categoryName: detail.cardCategory?.name || "",
          typeName: detail.cardType?.name || "",
          stationId: detail.stationId || "",
          quantity: String(detail.quantity || ""),
          startSerial: detail.sentSerialNumbers?.[0]
            ? detail.sentSerialNumbers[0]
            : "",
          endSerial: detail.sentSerialNumbers?.[
            detail.sentSerialNumbers.length - 1
          ]
            ? detail.sentSerialNumbers[detail.sentSerialNumbers.length - 1]
            : "",
          note: detail.note || "",
          notaDinas: detail.notaDinas || "",
          bast: detail.bast || "",
          requesterName: detail.requesterName || "",
          receiverName: detail.receiverName || "",
          notaDinasFile: null,
          bastFile: null,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  }, [id, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [maxAvailableSerial, setMaxAvailableSerial] = useState<string>("");

  // Fetch available serial when product changes
  useEffect(() => {
    const fetchSerial = async () => {
      setMaxAvailableSerial("");

      if (!form.productId) {
        if (!id) {
          setForm((prev) => ({
            ...prev,
            startSerial: "",
            endSerial: "",
            quantity: "",
          }));
        }
        return;
      }

      try {
        const data = await stockService.getAvailableSerialsStockOut(
          form.productId,
          programType,
        );
        console.log("Serial fetch result:", data);
        if (data?.startSerial) {
          setMaxAvailableSerial(data.endSerial || "");
          // Always update in Add mode to prevent stale serials from previous products
          if (!id) {
            setForm((prev) => ({
              ...prev,
              startSerial: data.startSerial,
              endSerial: "",
              quantity: "",
            }));
          }
        } else {
          setMaxAvailableSerial("");
          // Clear serials if not available for this product
          if (!id) {
            setForm((prev) => ({
              ...prev,
              startSerial: "",
              endSerial: "",
              quantity: "",
            }));
          }
          toast.error("Serial Number Belum Tersedia");
        }
      } catch (error: any) {
        // If it's just out of stock, warn in console, don't error track
        const msg = error?.message || "";
        if (
          msg.toLowerCase().includes("habis") ||
          msg.toLowerCase().includes("tidak tersedia")
        ) {
          console.warn("Stock not available:", msg);
        } else {
          console.error("Failed to fetch available serials", error);
        }

        setMaxAvailableSerial("");
        if (!id) {
          setForm((prev) => ({
            ...prev,
            startSerial: "",
            endSerial: "",
            quantity: "",
          }));
        }
        toast.error(msg || "Gagal mengambil data serial stok.");
      }
    };
    fetchSerial();
  }, [form.productId, programType]);

  // Calculate endSerial when quantity or startSerial changes
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
      const qty = parseInt(val);
      let newEnd = prev.endSerial;
      if (!isNaN(qty) && qty > 0 && prev.startSerial) {
        newEnd = calculateEndSerial(prev.startSerial, qty);
      } else {
        newEnd = "";
      }
      return { ...prev, quantity: val, endSerial: newEnd };
    });
  };

  const handleEndSerialChange = (val: string) => {
    setForm((prev) => {
      let newQty = prev.quantity;
      if (val && prev.startSerial) {
        const qty = calculateQuantity(prev.startSerial, val);
        newQty = qty > 0 ? String(qty) : "";
      } else {
        newQty = "";
      }
      return { ...prev, endSerial: val, quantity: newQty };
    });
  };

  const handleSubmit = async () => {
    // 1. Validation for Create
    if (!id) {
      if (!form.productId || !form.stationId) {
        toast.error("Data belum lengkap (Product/Station)");
        return;
      }
    } else {
      // Validation for Edit
      if (status !== "PENDING") {
        toast.error("Hanya transaksi PENDING yang dapat diubah");
        return;
      }
    }

    try {
      setSaving(true);
      const isEdit = !!id;

      if (isEdit) {
        // Edit flow usually stays JSON unless we also want to support file update (not requested yet but good practice, currently adhering to old json style for update to be safe)
        const payload: any = {
          movementAt: new Date(form.movementAt).toISOString(),
          stationId: form.stationId,
          note: form.note,
          startSerial: form.startSerial,
          endSerial: form.endSerial,
          notaDinas: form.notaDinas,
          bast: form.bast,
        };
        await stockService.updateStockOut(id, payload);
        toast.success("Stock out berhasil diperbarui");
      } else {
        // Create Flow with Object
        let finalStart = form.startSerial;
        let finalEnd = form.endSerial;
        let serialDate: string | undefined;

        if (programType === "VOUCHER") {
          serialDate = new Date(form.movementAt).toISOString();

          // Jika user input serial panjang, ambil suffix
          if (form.startSerial && form.startSerial.length > 10) {
            finalStart = form.startSerial.slice(-5);
          }
          if (form.endSerial && form.endSerial.length > 10) {
            finalEnd = form.endSerial.slice(-5);
          }
        }

        await stockService.createStockOut({
          programType,
          movementAt: new Date(form.movementAt).toISOString(),
          stationId: form.stationId,
          cardProductId: form.productId,
          note: form.note,
          startSerial: finalStart,
          endSerial: finalEnd,
          serialDate: serialDate,
          notaDinas: form.notaDinas,
          bast: form.bast,
          notaDinasFile: form.notaDinasFile,
          bastFile: form.bastFile,
        });
        toast.success("Stock Out berhasil disimpan");
      }

      router.push("/dashboard/superadmin/stock/out");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan stock out");
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setForm,
    products,
    categories,
    types,
    stations,
    loading,
    saving,
    status,
    handleSubmit,
    isEdit: !!id,
    isEditable: !id || status === "PENDING",
    maxAvailableSerial,
    handleQuantityChange,
    handleEndSerialChange,
  };
};

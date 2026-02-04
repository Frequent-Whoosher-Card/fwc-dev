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
        console.error("Failed to fetch available serials", error);
        setMaxAvailableSerial("");
        if (!id) {
          setForm((prev) => ({
            ...prev,
            startSerial: "",
            endSerial: "",
            quantity: "",
          }));
        }
        toast.error(error.message || "Gagal mengambil data serial stok.");
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
          form.movementAt,
          form.productId,
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
        // payload.batchId = form.batchId; // Auto/Immutable
        payload.notaDinas = form.notaDinas;
        payload.bast = form.bast;
        await stockService.updateStockOut(id, payload);
        toast.success("Stock out berhasil diperbarui");
      } else {
        const selectedProduct = products.find((p) => p.id === form.productId);
        if (!selectedProduct) {
          toast.error("Invalid Product");
          setSaving(false);
          return;
        }

        // Fix Payload for Create
        payload.cardProductId = form.productId;
        payload.startSerial = form.startSerial;
        payload.endSerial = form.endSerial;
        payload.quantity = Number(form.quantity);
        payload.programType = programType;

        // Add serialDate for Voucher (required by validation)
        if (programType === "VOUCHER") {
          // Heuristic: If startSerial is a full serial (length > 10), extract the date and suffix.
          // Voucher Format: Template + YYMMDD + Suffix(5)
          // We assume suffix is last 5 digits and date is 6 digits before that.
          if (form.startSerial && form.startSerial.length > 10) {
            const suffix = form.startSerial.slice(-5);
            const datePart = form.startSerial.slice(-11, -5); // YYMMDD
            // Reconstruct Date: 20YY-MM-DD
            // Note: This matches the format used in backend (YY year suffix)
            const year = `20${datePart.slice(0, 2)}`;
            const month = datePart.slice(2, 4);
            const day = datePart.slice(4, 6);
            const parsedDate = new Date(`${year}-${month}-${day}`);

            if (!isNaN(parsedDate.getTime())) {
              payload.serialDate = parsedDate.toISOString();
              payload.startSerial = suffix; // Send only suffix
            } else {
              // Fallback if parsing fails
              payload.serialDate = form.movementAt;
            }

            // Also handle endSerial if it's full
            if (form.endSerial && form.endSerial.length > 10) {
              payload.endSerial = form.endSerial.slice(-5);
            }
          } else {
            // Fallback for manual short input
            payload.serialDate = form.movementAt;
          }
        }

        payload.notaDinas = form.notaDinas;
        payload.bast = form.bast;

        await stockService.createStockOut(payload);
        toast.success("Stock Out berhasil disimpan");
      }

      router.push("/dashboard/superadmin/stock/out");
    } catch (error: any) {
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

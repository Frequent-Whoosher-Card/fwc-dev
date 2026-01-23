import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  purchaseFormSchema,
  type PurchaseFormSchema,
} from "@/lib/schemas/purchaseSchema";
import { createPurchase } from "@/lib/services/purchase.service";
import type { CreatePurchasePayload } from "@/types/purchase";

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function usePurchaseForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<PurchaseFormSchema>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      memberId: "",
      identityNumber: "",
      cardCategory: "" as any,
      cardTypeId: "",
      cardId: "",
      edcReferenceNumber: "",
      price: 0,
      purchaseDate: getTodayDate(),
      shiftDate: getTodayDate(),
    },
  });

  const onSubmit = async (data: PurchaseFormSchema) => {
    setShowConfirm(false);
    setIsSubmitting(true);

    try {
      const payload: CreatePurchasePayload = {
        memberId: data.memberId,
        cardId: data.cardId,
        purchaseDate: data.purchaseDate,
        shiftDate: data.shiftDate,
        edcReferenceNumber: data.edcReferenceNumber,
        price: data.price,
      };

      console.log("=== PURCHASE FORM DATA ===");
      console.log("Form data:", data);
      console.log("=== PAYLOAD TO BACKEND ===");
      console.log(JSON.stringify(payload, null, 2));

      await createPurchase(payload);
      toast.success("Purchase berhasil disimpan");
      router.push("/dashboard/superadmin/transaksi");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan transaksi");
      console.error("Purchase submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    form.handleSubmit(onSubmit)();
  };

  const openConfirmDialog = () => {
    form.handleSubmit(() => {
      setShowConfirm(true);
    })();
  };

  return {
    form,
    isSubmitting,
    showConfirm,
    setShowConfirm,
    openConfirmDialog,
    handleConfirm,
    onSubmit: form.handleSubmit(onSubmit),
  };
}

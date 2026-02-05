"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/apiConfig";
import { createMember } from "@/lib/services/membership.service";
import { createPurchase, createVoucherPurchase } from "@/lib/services/purchase.service";
import type { CreateMemberFormState } from "./types";
import type { UseFormReturn } from "react-hook-form";

interface SelectedCard {
  cardId: string;
  serialNumber: string;
  price: number;
}

interface UseCreateMemberSubmitProps {
  programType: "FWC" | "VOUCHER";
  form: CreateMemberFormState;
  identityType: "NIK" | "PASSPORT";
  cardId: string;
  cardCategory: string;
  displayFwcPrice: number | string;
  selectedCards: SelectedCard[];
  voucherForm: UseFormReturn<{ edcReferenceNumber?: string; bulkDiscountId?: number; notes?: string }>;
  voucherTotalPrice: number;
  operatorName: string;
  getFullPhoneNumber: () => string;
  nippKaiRef: React.RefObject<HTMLInputElement | null>;
}

export function useCreateMemberSubmit({
  programType,
  form,
  identityType,
  cardId,
  cardCategory,
  displayFwcPrice,
  selectedCards,
  voucherForm,
  voucherTotalPrice,
  operatorName,
  getFullPhoneNumber,
  nippKaiRef,
}: UseCreateMemberSubmitProps) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Membership Name wajib diisi");
      return;
    }

    if (!form.nik.trim()) {
      toast.error(identityType === "NIK" ? "NIK wajib diisi" : "Passport wajib diisi");
      return;
    }

    if (programType === "FWC") {
      if (!cardId) {
        toast.error("Serial Number wajib dipilih");
        return;
      }
    } else {
      if (selectedCards.length === 0) {
        toast.error("Minimal 1 voucher wajib dipilih");
        return;
      }
      if (!voucherForm.getValues("edcReferenceNumber")?.trim()) {
        toast.error("No. Reference EDC wajib diisi");
        return;
      }
    }

    if (cardCategory === "KAI" && !form.nippKai.trim()) {
      toast.error("Isi NIP / NIPP KAI untuk melanjutkan", {
        icon: "⚠️",
      });
      nippKaiRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      nippKaiRef.current?.focus();
      return;
    }

    if (identityType === "NIK") {
      if (form.nik.length !== 16) {
        toast.error("NIK harus 16 digit angka");
        return;
      }
    } else {
      if (form.nik.length < 1 || form.nik.length > 9) {
        toast.error("Passport maksimal 9 karakter (huruf/angka)");
        return;
      }
    }

    if (!form.nationality.trim()) {
      toast.error("Nationality wajib diisi");
      return;
    }

    if (!form.gender) {
      toast.error("Gender wajib dipilih");
      return;
    }

    if (!form.birthDate.trim()) {
      toast.error("Tanggal Lahir wajib diisi");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone Number wajib diisi");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email Address wajib diisi");
      return;
    }

    if (!form.address.trim()) {
      toast.error("Alamat wajib diisi");
      return;
    }

    if (!form.membershipDate) {
      toast.error("Membership Date tidak valid");
      return;
    }

    if (!form.expiredDate) {
      toast.error("Expired Date belum terisi");
      return;
    }

    if (!form.purchasedDate) {
      toast.error("Purchased Date tidak valid");
      return;
    }

    if (programType === "FWC" && !displayFwcPrice) {
      toast.error("FWC Price belum terisi");
      return;
    }

    if (!form.station) {
      toast.error("Stasiun wajib dipilih");
      return;
    }

    if (!form.shiftDate) {
      toast.error("Shift Date tidak valid");
      return;
    }

    if (programType === "FWC" && !form.edcReferenceNumber.trim()) {
      toast.error("No. Reference EDC wajib diisi");
      return;
    }

    if (!form.paymentMethodId?.trim()) {
      toast.error("Metode pembayaran wajib dipilih");
      return;
    }

    setTimeout(() => setShowSuccess(true), 0);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) {
        toast.error("Session expired. Silakan login kembali.");
        return;
      }

      const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error("Gagal mengambil data user");

      const meData = await meRes.json();
      if (!meData.data?.station?.id) {
        toast.error(
          "User tidak memiliki stasiun. Silakan hubungi administrator.",
          { duration: 5000 },
        );
        return;
      }
      const stationIdFromMe = meData.data.station.id;

      // Validation
      if (programType === "FWC") {
        if (!cardId) {
          toast.error("Serial Number wajib dipilih");
          return;
        }
        if (!form.edcReferenceNumber.trim()) {
          toast.error("No. Reference EDC wajib diisi");
          return;
        }
        if (!form.paymentMethodId?.trim()) {
          toast.error("Metode pembayaran wajib dipilih");
          return;
        }
      } else {
        if (selectedCards.length === 0) {
          toast.error("Minimal 1 voucher wajib dipilih");
          return;
        }
        const edcRef = voucherForm.getValues("edcReferenceNumber")?.trim();
        if (!edcRef) {
          toast.error("No. Reference EDC wajib diisi");
          return;
        }
        if (!form.paymentMethodId?.trim()) {
          toast.error("Metode pembayaran wajib dipilih");
          return;
        }
      }

      // Create member
      const memberPayload: any = {
        name: form.name,
        identityNumber: programType === "FWC" ? "FW" + form.nik : form.nik,
        nationality: form.nationality || undefined,
        email: form.email || undefined,
        phone: getFullPhoneNumber() || undefined,
        gender: form.gender || undefined,
        alamat: form.address || undefined,
        employeeTypeId: form.employeeTypeId || undefined,
        cityId: form.cityId || undefined,
        birthDate: form.birthDate?.trim() || undefined,
        paymentMethodId: form.paymentMethodId || undefined,
      };

      if (form.nippKai && form.nippKai.trim()) {
        memberPayload.nippKai = form.nippKai;
      }
      if (programType === "VOUCHER" && form.companyName?.trim()) {
        memberPayload.companyName = form.companyName.trim();
      }

      const memberRes = await createMember(memberPayload);

      if (!memberRes.success) {
        throw new Error(memberRes.error?.message || "Gagal membuat member");
      }

      const memberId = memberRes.data.id;

      // Create purchase
      if (programType === "FWC") {
        const purchaseRes = await createPurchase({
          cardId: cardId,
          memberId,
          edcReferenceNumber: form.edcReferenceNumber.trim(),
          purchasedDate: form.membershipDate,
          expiredDate: form.expiredDate,
          shiftDate: form.shiftDate,
          operatorName,
          stationId: stationIdFromMe,
        });

        if (!purchaseRes) {
          throw new Error("Gagal membuat transaksi");
        }
      } else {
        const voucherFormData = voucherForm.getValues();
        const voucherPayload = {
          memberId,
          cards: selectedCards.map((c) => ({
            cardId: c.cardId,
            price: c.price,
          })),
          edcReferenceNumber: voucherFormData.edcReferenceNumber.trim(),
          programType: "VOUCHER" as const,
          bulkDiscountId: voucherFormData.bulkDiscountId,
          price: voucherTotalPrice,
          notes: voucherFormData.notes || "",
        };

        await createVoucherPurchase(voucherPayload);
      }

      // Show success toast
      const successMessage = programType === "FWC" 
        ? "Member dan transaksi FWC berhasil disimpan"
        : "Member dan transaksi Voucher berhasil disimpan";
      toast.success(successMessage);
      
      // Redirect to transaction page with appropriate tab
      const tabParam = programType === "FWC" ? "fwc" : "voucher";
      setTimeout(() => {
        router.push(`/dashboard/superadmin/transaksi?tab=${tabParam}`);
      }, 500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    showSuccess,
    setShowSuccess,
    isSubmitting,
    handleSubmit,
    handleConfirmSubmit,
  };
}

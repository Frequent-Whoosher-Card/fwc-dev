"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CreateMemberFormState } from "./types";
import type { CardProduct } from "./types";
import { calculateExpiredDate } from "./constants";

interface UseExpiredDateCalculationProps {
  programType: "FWC" | "VOUCHER";
  form: CreateMemberFormState;
  setForm: Dispatch<SetStateAction<CreateMemberFormState>>;
  // FWC
  cardTypeId?: string;
  categoryId?: string;
  cardProducts: CardProduct[];
  // Voucher
  selectedVoucherTypeId?: string;
  voucherProducts: any[];
}

export function useExpiredDateCalculation({
  programType,
  form,
  setForm,
  cardTypeId,
  categoryId,
  cardProducts,
  selectedVoucherTypeId,
  voucherProducts,
}: UseExpiredDateCalculationProps) {
  // Auto-calculate expired date for FWC when cardTypeId or membershipDate changes
  useEffect(() => {
    if (programType !== "FWC" || !cardTypeId || !form.membershipDate) return;

    const selectedProduct = cardProducts.find(
      (p) => p.typeId === cardTypeId && p.categoryId === categoryId
    );

    if (selectedProduct && selectedProduct.masaBerlaku) {
      const expDate = calculateExpiredDate(
        form.membershipDate,
        selectedProduct.masaBerlaku
      );
      setForm((prev) => ({
        ...prev,
        expiredDate: expDate,
      }));
    }
  }, [
    programType,
    cardTypeId,
    categoryId,
    form.membershipDate,
    cardProducts,
    setForm,
  ]);

  // Auto-calculate expired date for VOUCHER when voucher type and membership date are set
  useEffect(() => {
    if (programType !== "VOUCHER" || !selectedVoucherTypeId || !form.membershipDate)
      return;

    const matchedProduct = voucherProducts.find(
      (p: any) => p.type?.id === selectedVoucherTypeId
    );

    if (matchedProduct && matchedProduct.masaBerlaku) {
      const expDate = calculateExpiredDate(
        form.membershipDate,
        Number(matchedProduct.masaBerlaku)
      );
      setForm((prev) => ({
        ...prev,
        expiredDate: expDate,
      }));
    }
  }, [
    programType,
    selectedVoucherTypeId,
    form.membershipDate,
    voucherProducts,
    setForm,
  ]);
}

"use client";

import { ChevronDown } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { SectionCard } from "./SectionCard";

interface PaymentMethod {
  id: string;
  name: string;
}

interface PaymentSectionProps {
  programType: "FWC" | "VOUCHER";
  /** FWC: form.edcReferenceNumber + handleChange + setFieldError + checkUniqueField */
  edcReferenceNumber?: string;
  onEdcChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEdcInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  onEdcBlur?: () => void;
  edcFieldError?: string;
  edcChecking?: boolean;
  /** Voucher: react-hook-form register */
  voucherEdcRegister?: ReturnType<
    UseFormRegister<{ edcReferenceNumber?: string }>
  >;
  paymentMethodId: string;
  onPaymentMethodChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  paymentMethods: PaymentMethod[];
  loadingPaymentMethods: boolean;
  Field?: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => React.ReactElement;
}

export function PaymentSection({
  programType,
  edcReferenceNumber = "",
  onEdcChange,
  onEdcInput,
  onEdcBlur,
  edcFieldError,
  edcChecking,
  voucherEdcRegister,
  paymentMethodId,
  onPaymentMethodChange,
  paymentMethods,
  loadingPaymentMethods,
  Field = MemberFormField,
}: PaymentSectionProps) {
  return (
    <SectionCard title="Payment Information">
      <Field label="No. Reference EDC" required>
        <div className="relative">
          {programType === "FWC" ? (
            <input
              name="edcReferenceNumber"
              value={edcReferenceNumber}
              onChange={onEdcChange}
              onInput={onEdcInput}
              onBlur={onEdcBlur}
              placeholder="No. Reference EDC (max 12 digit)"
              className={`${base} pr-40 ${
                edcFieldError ? "border-red-500" : ""
              }`}
              maxLength={12}
              required
            />
          ) : (
            voucherEdcRegister && (
              <input
                {...voucherEdcRegister}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value
                    .replace(/\D/g, "")
                    .slice(0, 12);
                }}
                placeholder="No. Reference EDC (max 12 digit)"
                className={`${base} pr-40`}
                maxLength={12}
                required
              />
            )
          )}
          {programType === "FWC" && edcFieldError && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600">
              {edcFieldError}
            </span>
          )}
          {programType === "FWC" && !edcFieldError && edcChecking && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Checking...
            </span>
          )}
        </div>
      </Field>
      <Field label="Payment Method" required>
        <div className="relative">
          <select
            name="paymentMethodId"
            value={paymentMethodId}
            onChange={onPaymentMethodChange}
            disabled={loadingPaymentMethods}
            className={`${base} pr-10 appearance-none`}
            required
          >
            <option value="">Pilih metode pembayaran</option>
            {paymentMethods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </Field>
    </SectionCard>
  );
}

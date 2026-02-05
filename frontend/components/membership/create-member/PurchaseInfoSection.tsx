"use client";

import { DollarSign, Calendar } from "lucide-react";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { SectionCard } from "./SectionCard";

interface SelectedCard {
  cardId: string;
  serialNumber: string;
  price: number;
}

interface PurchaseInfoSectionProps {
  programType: "FWC" | "VOUCHER";
  purchasedDate: string;
  displayFwcPrice: number | string;
  selectedCards: SelectedCard[];
  voucherDiscountAmount: number;
  voucherTotalPrice: number;
  Field?: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => React.ReactElement;
}

export function PurchaseInfoSection({
  programType,
  purchasedDate,
  displayFwcPrice,
  selectedCards,
  voucherDiscountAmount,
  voucherTotalPrice,
  Field = MemberFormField,
}: PurchaseInfoSectionProps) {
  return (
    <SectionCard title="Purchase Information">
      {programType === "FWC" ? (
        <>
          <Field label="Purchased Date" required>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="date"
                name="purchasedDate"
                value={purchasedDate}
                readOnly
                className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
              />
            </div>
          </Field>
          <Field label="FWC Price" required>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                name="price"
                value={displayFwcPrice || ""}
                readOnly
                placeholder="FWC Price"
                className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
                required
              />
            </div>
          </Field>
        </>
      ) : (
        <>
          {selectedCards.length > 0 && (
            <>
              <Field label="Subtotal">
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    value={`Rp ${selectedCards
                      .reduce((sum, card) => sum + (card.price || 0), 0)
                      .toLocaleString("id-ID")}`}
                    readOnly
                    className={`${base} pr-10 bg-gray-50 cursor-not-allowed`}
                  />
                </div>
              </Field>
              {voucherDiscountAmount > 0 && (
                <Field label="Discount">
                  <div className="relative">
                    <DollarSign
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      value={`- Rp ${voucherDiscountAmount.toLocaleString("id-ID")}`}
                      readOnly
                      className={`${base} pr-10 bg-gray-50 cursor-not-allowed text-green-600`}
                    />
                  </div>
                </Field>
              )}
              <Field label="Total Price" required>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    value={`Rp ${voucherTotalPrice.toLocaleString("id-ID")}`}
                    readOnly
                    className={`${base} pr-10 bg-gray-50 cursor-not-allowed font-semibold`}
                    required
                  />
                </div>
              </Field>
            </>
          )}
        </>
      )}
    </SectionCard>
  );
}

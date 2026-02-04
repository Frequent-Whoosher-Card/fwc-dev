import type { CreateMemberFormState } from "./types";

interface BuildSuccessModalDataParams {
  form: CreateMemberFormState;
  programType: "FWC" | "VOUCHER";
  getFullPhoneNumber: () => string;
  paymentMethodName: string;
  cardCategory: string;
  cardTypeName: string;
  serialNumber: string;
  selectedCardsCount: number;
  voucherSubtotal: string;
  voucherDiscountLabel: string;
  voucherTotalPrice: string;
  displayFwcPrice: number | string;
  cardProductTotalQuota: string | number | undefined;
  edcReferenceNumber: string;
}

export function buildSuccessModalData({
  form,
  programType,
  getFullPhoneNumber,
  paymentMethodName,
  cardCategory,
  cardTypeName,
  serialNumber,
  selectedCardsCount,
  voucherSubtotal,
  voucherDiscountLabel,
  voucherTotalPrice,
  displayFwcPrice,
  cardProductTotalQuota,
  edcReferenceNumber,
}: BuildSuccessModalDataParams): Record<string, string> {
  return {
    "Membership Name": form.name,
    "Identity Number": form.nik,
    "NIP / NIPP KAI": form.nippKai || "-",
    Nationality: form.nationality || "Indonesia",
    Gender:
      form.gender === "L"
        ? "Laki - Laki"
        : form.gender === "P"
          ? "Perempuan"
          : "-",
    "Tanggal Lahir": form.birthDate || "-",
    "Phone Number": getFullPhoneNumber(),
    "Email Address": form.email,
    Address: form.address,
    "Payment Method": paymentMethodName,

    "Program Type": programType,

    ...(programType === "FWC"
      ? {
          "Card Category": cardCategory || "-",
          "Card Type": cardTypeName || "-",
          "Serial Number": serialNumber || "-",
        }
      : {
          "Number of Vouchers": selectedCardsCount.toString(),
          "Voucher Subtotal": voucherSubtotal,
          Discount: voucherDiscountLabel,
          "Total Price": voucherTotalPrice,
        }),

    "Membership Date": form.membershipDate,
    "Expired Date": form.expiredDate,

    "Purchased Date": form.purchasedDate,
    ...(programType === "FWC"
      ? {
          "FWC Price": displayFwcPrice
            ? `Rp ${Number(displayFwcPrice).toLocaleString("id-ID")}`
            : "-",
          "Total Quota (Trips)": String(cardProductTotalQuota ?? "-"),
        }
      : {}),

    Stasiun: form.station,
    "Shift Date": form.shiftDate,

    "No. Reference EDC": edcReferenceNumber,
  };
}

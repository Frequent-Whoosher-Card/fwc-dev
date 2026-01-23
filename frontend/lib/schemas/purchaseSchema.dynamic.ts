import { z } from "zod";
import { getValidationConfig } from "@/lib/services/config.service";

/**
 * Build dynamic purchase form schema based on validation config from API
 */
export async function buildPurchaseFormSchema() {
  const config = await getValidationConfig();

  return z.object({
    identityNumber: z
      .string()
      .min(1, "Identity Number wajib diisi")
      .regex(
        new RegExp(config.identityNumber.pattern),
        "Identity Number harus berupa angka",
      )
      .min(
        config.identityNumber.minLength,
        `Identity Number minimal ${config.identityNumber.minLength} digit`,
      )
      .max(
        config.identityNumber.maxLength,
        `Identity Number maksimal ${config.identityNumber.maxLength} digit`,
      ),

    cardCategory: z
      .enum(["GOLD", "SILVER", "KAI"], {
        required_error: "Card Category wajib dipilih",
      })
      .or(z.literal("")),

    cardTypeId: z.string().min(1, "Card Type wajib dipilih"),

    cardId: z.string().min(1, "Serial Number wajib dipilih"),

    edcReferenceNumber: z
      .string()
      .min(1, "No. Reference EDC wajib diisi")
      .regex(
        new RegExp(config.edcReference.pattern),
        "No. Reference EDC harus berupa angka",
      )
      .max(
        config.edcReference.maxLength,
        `No. Reference EDC maksimal ${config.edcReference.maxLength} digit`,
      ),

    price: z.number().min(0, "Price harus >= 0"),

    purchaseDate: z.string().min(1, "Purchase Date wajib diisi"),

    shiftDate: z.string().min(1, "Shift Date wajib diisi"),
  });
}

/**
 * Build dynamic member create schema
 */
export async function buildMemberCreateSchema() {
  const config = await getValidationConfig();

  return z.object({
    identityNumber: z
      .string()
      .min(1, "Identity Number wajib diisi")
      .min(
        config.identityNumber.minLength,
        `Minimal ${config.identityNumber.minLength} digit`,
      )
      .max(
        config.identityNumber.maxLength,
        `Maksimal ${config.identityNumber.maxLength} digit`,
      ),
    type: z.enum(["PUBLIC", "KAI"]),
    name: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(
        new RegExp(config.phoneNumber.pattern),
        "Phone number harus berupa angka",
      )
      .min(
        config.phoneNumber.minLength,
        `Minimal ${config.phoneNumber.minLength} digit`,
      )
      .max(
        config.phoneNumber.maxLength,
        `Maksimal ${config.phoneNumber.maxLength} digit`,
      )
      .optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  });
}

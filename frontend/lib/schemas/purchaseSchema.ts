import { z } from "zod";

export const purchaseFormSchema = z.object({
  memberId: z.string().min(1, "Member wajib dipilih"),
  
  identityNumber: z
    .string()
    .min(1, "Identity Number wajib diisi")
    .min(6, "Identity Number minimal 6 karakter")
    .max(20, "Identity Number maksimal 20 karakter"),

  cardCategory: z
    .enum(["GOLD", "SILVER", "KAI"])
    .or(z.literal(""))
    .optional()
    .default(""),

  cardTypeId: z.string().optional().default(""),

  cardId: z.string().min(1, "Serial Number wajib dipilih"),

  edcReferenceNumber: z
    .string()
    .min(1, "No. Reference EDC wajib diisi")
    .regex(/^\d+$/, "No. Reference EDC harus berupa angka")
    .max(12, "No. Reference EDC maksimal 12 digit"),

  paymentMethodId: z.string().min(1, "Payment Method wajib dipilih"),

  price: z.number().min(0, "Price harus >= 0"),

  purchaseDate: z.string().min(1, "Purchase Date wajib diisi"),

  shiftDate: z.string().min(1, "Shift Date wajib diisi"),
});

export type PurchaseFormSchema = z.infer<typeof purchaseFormSchema>;

export const memberCreateSchema = z.object({
  identityNumber: z.string().min(1),
  type: z.enum(["PUBLIC", "KAI"]),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type MemberCreateSchema = z.infer<typeof memberCreateSchema>;

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import axios from "@/lib/axios";
import { createVoucherPurchase } from "@/lib/services/purchase.service";
import type { CreateVoucherPurchasePayload } from "@/lib/services/purchase.service";

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface BulkDiscount {
  id: number;
  minQuantity: number;
  maxQuantity: number | null;
  discount: number | string;
}

export interface SelectedCard {
  cardId: string;
  serialNumber: string;
  price: number;
}

const voucherBulkPurchaseFormSchema = z.object({
  memberId: z.string().min(1, "Member wajib dipilih"),
  identityNumber: z
    .string()
    .min(1, "Identity Number wajib diisi")
    .regex(/^\d+$/, "Identity Number harus berupa angka")
    .min(6, "Identity Number minimal 6 digit")
    .max(20, "Identity Number maksimal 20 digit"),
  cards: z
    .array(
      z.object({
        cardId: z.string().min(1, "Card ID wajib diisi"),
        price: z.number().min(0).optional(),
      })
    )
    .min(1, "Minimal 1 kartu wajib dipilih"),
  edcReferenceNumber: z
    .string()
    .min(1, "No. Reference EDC wajib diisi")
    .regex(/^\d+$/, "No. Reference EDC harus berupa angka")
    .max(20, "No. Reference EDC maksimal 20 digit"),
  bulkDiscountId: z.number().optional(),
  price: z.number().min(0, "Price harus >= 0").optional(),
  notes: z.string().max(500).optional(),
});

export type VoucherBulkPurchaseFormSchema = z.infer<
  typeof voucherBulkPurchaseFormSchema
>;

export function useVoucherBulkPurchaseForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<BulkDiscount[]>([]);
  const [selectedBulkDiscountId, setSelectedBulkDiscountId] = useState<
    number | undefined
  >(undefined);
  const [totalPrice, setTotalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  const form = useForm<VoucherBulkPurchaseFormSchema>({
    resolver: zodResolver(voucherBulkPurchaseFormSchema),
    defaultValues: {
      memberId: "",
      identityNumber: "",
      cards: [],
      edcReferenceNumber: "",
      bulkDiscountId: undefined,
      price: undefined,
      notes: "",
    },
  });

  // Fetch bulk discounts
  useEffect(() => {
    const fetchBulkDiscounts = async () => {
      try {
        const response = await axios.get("/discounts");
        const discounts = response.data?.data || [];
        setBulkDiscounts(discounts);
      } catch (error) {
        console.error("Failed to fetch bulk discounts:", error);
      }
    };
    fetchBulkDiscounts();
  }, []);

  // Calculate total price and discount
  useEffect(() => {
    const cards = form.getValues("cards");
    if (cards.length === 0) {
      setTotalPrice(0);
      setDiscountAmount(0);
      return;
    }

    // Calculate subtotal from selected cards
    const subtotal = selectedCards.reduce(
      (sum, card) => sum + (card.price || 0),
      0
    );

    // Apply bulk discount if selected
    let finalPrice = subtotal;
    let discount = 0;

    if (selectedBulkDiscountId && cards.length > 0) {
      const discountRule = bulkDiscounts.find(
        (d) => d.id === selectedBulkDiscountId
      );

      if (discountRule) {
        const quantity = cards.length;
        const minQty = discountRule.minQuantity;
        const maxQty = discountRule.maxQuantity;

        // Check if quantity matches discount rule
        if (
          quantity >= minQty &&
          (maxQty === null || quantity <= maxQty)
        ) {
          // Discount is stored as percentage (e.g., 10 means 10%)
          const discountPercentage = Number(discountRule.discount);
          discount = (subtotal * discountPercentage) / 100;
          finalPrice = subtotal - discount;
        }
      }
    }

    setTotalPrice(finalPrice);
    setDiscountAmount(discount);
    form.setValue("price", finalPrice);
  }, [selectedCards, selectedBulkDiscountId, bulkDiscounts, form]);

  const addCard = (card: SelectedCard) => {
    setSelectedCards((prevCards) => {
      // Check if card already exists using current state
      if (prevCards.find((c) => c.cardId === card.cardId)) {
        toast.warning("Kartu sudah dipilih");
        return prevCards; // Return unchanged state
      }
      const newCards = [...prevCards, card];
      // Update form value with new cards
      form.setValue(
        "cards",
        newCards.map((c) => ({ cardId: c.cardId, price: c.price || undefined }))
      );
      return newCards;
    });
  };

  // Batch add multiple cards at once
  const addCards = (cards: SelectedCard[]) => {
    setSelectedCards((prevCards) => {
      const existingCardIds = new Set(prevCards.map((c) => c.cardId));
      const newCardsToAdd = cards.filter((card) => !existingCardIds.has(card.cardId));
      
      if (newCardsToAdd.length === 0) {
        if (cards.length > 0) {
          toast.warning("Semua kartu sudah dipilih");
        }
        return prevCards;
      }
      
      const updatedCards = [...prevCards, ...newCardsToAdd];
      // Update form value with all cards
      form.setValue(
        "cards",
        updatedCards.map((c) => ({ cardId: c.cardId, price: c.price || undefined }))
      );
      return updatedCards;
    });
  };

  const removeCard = (cardId: string) => {
    const newCards = selectedCards.filter((c) => c.cardId !== cardId);
    setSelectedCards(newCards);
    form.setValue(
      "cards",
      newCards.map((c) => ({ cardId: c.cardId, price: c.price }))
    );
  };

  const clearAllCards = () => {
    setSelectedCards([]);
    form.setValue("cards", []);
    setSelectedBulkDiscountId(undefined);
    form.setValue("bulkDiscountId", undefined);
  };

  const handleBulkDiscountChange = (discountId: number | undefined) => {
    setSelectedBulkDiscountId(discountId);
    form.setValue("bulkDiscountId", discountId);
  };

  const onSubmit = async (data: VoucherBulkPurchaseFormSchema) => {
    setShowConfirm(false);
    setIsSubmitting(true);

    try {
      // Ensure all cards have valid cardId
      const validCards = data.cards.filter((c) => c.cardId);
      
      const payload: CreateVoucherPurchasePayload = {
        memberId: data.memberId,
        cards: validCards.map((c) => ({
          cardId: c.cardId,
          price: c.price,
        })),
        edcReferenceNumber: data.edcReferenceNumber,
        programType: "VOUCHER",
        bulkDiscountId: data.bulkDiscountId,
        price: data.price,
        notes: data.notes,
      };

      console.log("=== VOUCHER BULK PURCHASE FORM DATA ===");
      console.log("Form data:", data);
      console.log("=== PAYLOAD TO BACKEND ===");
      console.log(JSON.stringify(payload, null, 2));

      await createVoucherPurchase(payload);
      toast.success("Voucher bulk purchase berhasil disimpan");
      router.push("/dashboard/superadmin/transaksi");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan transaksi");
      console.error("Voucher bulk purchase submission error:", error);
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
    selectedCards,
    addCard,
    addCards,
    removeCard,
    clearAllCards,
    bulkDiscounts,
    selectedBulkDiscountId,
    handleBulkDiscountChange,
    totalPrice,
    discountAmount,
  };
}

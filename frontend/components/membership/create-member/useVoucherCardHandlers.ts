"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import axios from "@/lib/axios";
import { cardVoucherService } from "@/lib/services/card.voucher.service";
import { getNextAvailableCards } from "@/lib/services/card.service";

interface SelectedCard {
  cardId: string;
  serialNumber: string;
  price: number;
}

interface UseVoucherCardHandlersProps {
  inputMode: "" | "manual" | "recommendation" | "range";
  selectedCards: SelectedCard[];
  addVoucherCard: (card: { cardId: string; serialNumber: string; price: number }) => void;
  addVoucherCards: (cards: { cardId: string; serialNumber: string; price: number }[]) => void;
}

function generateSerialNumbers(startSerial: string, quantity: number): string[] {
  const serials: string[] = [];
  // Match all trailing digits as suffix - use greedy match on digits to capture all trailing digits
  // This ensures we correctly parse serials like "031326020200500" -> prefix: "031326020200", suffix: "500"
  const match = startSerial.match(/^(.+)(\d+)$/);
  
  if (!match) {
    return [startSerial];
  }
  
  const prefix = match[1];
  const startNumber = parseInt(match[2], 10);
  const originalPadding = match[2].length;
  
  // Calculate the maximum number we'll generate to determine required padding upfront
  const endNumber = startNumber + quantity - 1;
  const maxDigits = endNumber.toString().length;
  // Use the larger of original padding or max digits needed
  const requiredPadding = Math.max(originalPadding, maxDigits);
  
  for (let i = 0; i < quantity; i++) {
    const number = startNumber + i;
    // Use consistent padding for all numbers in the batch
    const paddedNumber = number.toString().padStart(requiredPadding, '0');
    serials.push(`${prefix}${paddedNumber}`);
  }
  
  return serials;
}

function getUserStationId(): string | null {
  try {
    const userStr = localStorage.getItem("fwc_user");
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.stationId || null;
  } catch {
    return null;
  }
}

export function useVoucherCardHandlers({
  inputMode,
  selectedCards,
  addVoucherCard,
  addVoucherCards,
}: UseVoucherCardHandlersProps) {
  const [selectedVoucherCategoryId, setSelectedVoucherCategoryId] = useState<string>("");
  const [selectedVoucherTypeId, setSelectedVoucherTypeId] = useState<string>("");
  const [voucherProducts, setVoucherProducts] = useState<any[]>([]);
  const [selectedVoucherCardId, setSelectedVoucherCardId] = useState<string>("");
  const [voucherCardPrice, setVoucherCardPrice] = useState<number>(0);
  const [voucherCardSerialNumber, setVoucherCardSerialNumber] = useState<string>("");
  const [voucherCardSearchResults, setVoucherCardSearchResults] = useState<any[]>([]);
  const [isSearchingVoucherCards, setIsSearchingVoucherCards] = useState(false);
  
  // Range input state
  const [rangeStartSerial, setRangeStartSerial] = useState<string>("");
  const [rangeQuantity, setRangeQuantity] = useState<string>("");
  const [isAddingRange, setIsAddingRange] = useState(false);
  const [rangeSearchResults, setRangeSearchResults] = useState<any[]>([]);
  const [isSearchingRange, setIsSearchingRange] = useState(false);

  const handleVoucherCategoryChange = useCallback(async (categoryId: string) => {
    try {
      setSelectedVoucherCategoryId(categoryId);
      setSelectedVoucherTypeId("");
      setSelectedVoucherCardId("");
      setVoucherCardPrice(0);
      setVoucherCardSerialNumber("");
      setVoucherCardSearchResults([]);
      setRangeStartSerial("");

      if (!categoryId) {
        setVoucherProducts([]);
        return;
      }

      const products = await cardVoucherService.getProducts();
      const filteredProducts = products.filter(
        (p: any) => p.categoryId === categoryId
      );
      setVoucherProducts(filteredProducts);

      if (filteredProducts.length === 0) {
        toast.error("Tidak ada produk voucher tersedia untuk kategori ini");
      }
    } catch (error) {
      toast.error("Gagal memuat produk voucher");
      console.error(error);
    }
  }, []);

  const handleVoucherTypeChange = useCallback(async (typeId: string) => {
    try {
      setSelectedVoucherTypeId(typeId);
      setSelectedVoucherCardId("");
      setVoucherCardSearchResults([]);

      if (!typeId || !selectedVoucherCategoryId) {
        setVoucherCardPrice(0);
        setVoucherCardSerialNumber("");
        setRangeStartSerial("");
        return;
      }

      const matchedProduct = voucherProducts.find(
        (p: any) => p.type?.id === typeId
      );
      if (matchedProduct) {
        setVoucherCardPrice(Number(matchedProduct.price) || 0);
        const serialTemplate = matchedProduct?.serialTemplate || "";
        setVoucherCardSerialNumber(serialTemplate);
        
        if (inputMode === "range") {
          setRangeStartSerial(serialTemplate);
          if (serialTemplate.length >= 6) {
            setTimeout(() => {
              handleRangeSerialSearch(serialTemplate);
            }, 200);
          }
        }
      } else {
        setVoucherCardSerialNumber("");
        if (inputMode === "range") {
          setRangeStartSerial("");
        }
      }
    } catch (error) {
      toast.error("Gagal memuat voucher");
      console.error(error);
    }
  }, [selectedVoucherCategoryId, voucherProducts, inputMode]);

  const handleVoucherCardSearch = useCallback(async (query: string) => {
    setVoucherCardSerialNumber(query);

    if (!query || query.length < 6) {
      setVoucherCardSearchResults([]);
      return;
    }

    try {
      setIsSearchingVoucherCards(true);
      const userStationId = getUserStationId();

      const params: any = {
        search: query,
        status: "IN_STATION",
        limit: 10,
        programType: "VOUCHER",
        sortBy: "serialNumber",
        sortOrder: "asc",
      };

      if (selectedVoucherCategoryId) params.categoryId = selectedVoucherCategoryId;
      if (selectedVoucherTypeId) params.typeId = selectedVoucherTypeId;
      if (userStationId) params.stationId = userStationId;

      const response = await axios.get("/cards", { params });
      const results = response.data?.data?.items || [];
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber)
      );
      setVoucherCardSearchResults(sortedResults);

      // Auto-add if exact match found
      const exactMatch = sortedResults.find((card: any) => card.serialNumber === query);
      if (exactMatch) {
        addVoucherCard({
          cardId: exactMatch.id,
          serialNumber: exactMatch.serialNumber,
          price: voucherCardPrice || 0,
        });
        setVoucherCardSerialNumber("");
        setSelectedVoucherCardId("");
        setVoucherCardSearchResults([]);
        return;
      }

      // Auto-add if there's a longer match (e.g., user typed "03132602020009" but "031326020200090" exists)
      const longerMatch = sortedResults.find((card: any) => 
        card.serialNumber.startsWith(query) && card.serialNumber.length > query.length
      );
      if (longerMatch && sortedResults.length === 1) {
        // Only auto-add if there's exactly one result that starts with the query
        addVoucherCard({
          cardId: longerMatch.id,
          serialNumber: longerMatch.serialNumber,
          price: voucherCardPrice || 0,
        });
        toast.error(`Voucher ${query} tidak tersedia, ${longerMatch.serialNumber} tersedia dan sudah ditambahkan`);
        setVoucherCardSerialNumber("");
        setSelectedVoucherCardId("");
        setVoucherCardSearchResults([]);
        return;
      }
    } catch (error) {
      console.error("Error searching voucher cards:", error);
      setVoucherCardSearchResults([]);
    } finally {
      setIsSearchingVoucherCards(false);
    }
  }, [selectedVoucherCategoryId, selectedVoucherTypeId, voucherCardPrice, addVoucherCard]);

  const handleVoucherCardSelect = useCallback((card: any) => {
    setSelectedVoucherCardId(card.id);
    setVoucherCardSerialNumber(card.serialNumber);
    setVoucherCardSearchResults([]);
  }, []);

  const handleRangeSerialSearch = useCallback(async (query: string) => {
    setRangeStartSerial(query);

    if (!query || query.length < 6) {
      setRangeSearchResults([]);
      return;
    }

    if (!selectedVoucherCategoryId || !selectedVoucherTypeId) {
      setRangeSearchResults([]);
      return;
    }

    try {
      setIsSearchingRange(true);
      const userStationId = getUserStationId();

      const params: any = {
        search: query,
        status: "IN_STATION",
        limit: 10,
        programType: "VOUCHER",
        categoryId: selectedVoucherCategoryId,
        typeId: selectedVoucherTypeId,
        sortBy: "serialNumber",
        sortOrder: "asc",
      };

      if (userStationId) {
        params.stationId = userStationId;
      }

      const response = await axios.get("/cards", { params });
      const results = response.data?.data?.items || [];
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber)
      );
      setRangeSearchResults(sortedResults);
    } catch (error) {
      console.error("Error searching range voucher cards:", error);
      setRangeSearchResults([]);
    } finally {
      setIsSearchingRange(false);
    }
  }, [selectedVoucherCategoryId, selectedVoucherTypeId]);

  const handleRangeCardSelect = useCallback((card: any) => {
    setRangeStartSerial(card.serialNumber);
    setRangeSearchResults([]);
  }, []);

  const handleAddSelectedVoucherCard = useCallback(() => {
    const cardToAdd = selectedVoucherCardId 
      ? voucherCardSearchResults.find((c) => c.id === selectedVoucherCardId)
      : null;

    if (!cardToAdd || !voucherCardSerialNumber) {
      return;
    }

    addVoucherCard({
      cardId: cardToAdd.id,
      serialNumber: cardToAdd.serialNumber,
      price: voucherCardPrice || 0,
    });
    
    setVoucherCardSerialNumber("");
    setSelectedVoucherCardId("");
  }, [selectedVoucherCardId, voucherCardSearchResults, voucherCardSerialNumber, voucherCardPrice, addVoucherCard]);

  const handleAddRange = useCallback(async () => {
    if (!rangeStartSerial || !rangeQuantity) {
      toast.error("Serial number awal dan quantity wajib diisi");
      return;
    }

    const quantity = parseInt(rangeQuantity, 10);
    if (isNaN(quantity) || quantity < 1 || quantity > 10000) {
      toast.error("Quantity harus antara 1-10000");
      return;
    }

    if (!selectedVoucherCategoryId || !selectedVoucherTypeId) {
      toast.error("Pilih Category dan Type terlebih dahulu");
      return;
    }

    setIsAddingRange(true);
    try {
      const product = voucherProducts.find(
        (p: any) => p.categoryId === selectedVoucherCategoryId && p.type?.id === selectedVoucherTypeId
      );
      const pricePerCard = product ? Number(product.price) || 0 : 0;

      const userStationId = getUserStationId();

      // Get next available cards starting from rangeStartSerial
      const batchResult = await getNextAvailableCards({
        startSerial: rangeStartSerial,
        quantity: quantity,
        status: "IN_STATION",
        programType: "VOUCHER",
        categoryId: selectedVoucherCategoryId,
        typeId: selectedVoucherTypeId,
        stationId: userStationId || undefined,
      });

      // Cards are already ordered by serial number ascending
      const validCards = batchResult.items;

      if (validCards.length === 0) {
        toast.error("Tidak ada voucher ditemukan untuk serial numbers tersebut");
        return;
      }

      if (batchResult.foundCount < batchResult.requestedCount) {
        toast.error(
          `Hanya ${batchResult.foundCount} dari ${batchResult.requestedCount} voucher yang tersedia. Range: ${batchResult.startSerial || rangeStartSerial} - ${batchResult.endSerial || "tidak ada"}`,
          { duration: 5000 }
        );
      }

      const existingCardIds = new Set(selectedCards.map((c) => c.cardId));
      const newCardsToAdd = validCards.filter(
        (card) => !existingCardIds.has(card.id)
      );
      
      const skippedCount = validCards.length - newCardsToAdd.length;

      if (newCardsToAdd.length > 0) {
        const cardsToAdd = newCardsToAdd.map((card) => ({
          cardId: card.id,
          serialNumber: card.serialNumber,
          price: pricePerCard,
        }));
        addVoucherCards(cardsToAdd);
      }

      if (skippedCount > 0) {
        toast.error(`${newCardsToAdd.length} voucher berhasil ditambahkan, ${skippedCount} sudah ada sebelumnya`, { duration: 4000 });
      } else {
        toast.success(`${newCardsToAdd.length} voucher berhasil ditambahkan`);
      }
      
      // Keep the prefix, only reset the suffix
      const SERIAL_PREFIX_LEN = 4;
      const prefix = rangeStartSerial.slice(0, SERIAL_PREFIX_LEN);
      setRangeStartSerial(prefix);
      setRangeQuantity("");
    } catch (error) {
      toast.error("Gagal menambahkan voucher range");
      console.error("Error adding range:", error);
    } finally {
      setIsAddingRange(false);
    }
  }, [rangeStartSerial, rangeQuantity, selectedVoucherCategoryId, selectedVoucherTypeId, voucherProducts, selectedCards, addVoucherCards]);

  // Auto-fill range start serial when switching to range mode
  useEffect(() => {
    if (inputMode === "range" && selectedVoucherTypeId && selectedVoucherCategoryId && voucherProducts.length > 0) {
      const matchedProduct = voucherProducts.find(
        (p: any) => p.type?.id === selectedVoucherTypeId
      );
      if (matchedProduct && matchedProduct.serialTemplate) {
        const serialTemplate = matchedProduct.serialTemplate;
        setRangeStartSerial(serialTemplate);
        if (serialTemplate.length >= 6) {
          setTimeout(() => {
            handleRangeSerialSearch(serialTemplate);
          }, 100);
        }
      }
    }
  }, [inputMode, selectedVoucherTypeId, selectedVoucherCategoryId, voucherProducts, handleRangeSerialSearch]);

  return {
    // State
    selectedVoucherCategoryId,
    selectedVoucherTypeId,
    voucherProducts,
    selectedVoucherCardId,
    voucherCardPrice,
    voucherCardSerialNumber,
    voucherCardSearchResults,
    isSearchingVoucherCards,
    rangeStartSerial,
    rangeQuantity,
    isAddingRange,
    rangeSearchResults,
    isSearchingRange,
    // Setters
    setRangeQuantity,
    // Handlers
    handleVoucherCategoryChange,
    handleVoucherTypeChange,
    handleVoucherCardSearch,
    handleVoucherCardSelect,
    handleRangeSerialSearch,
    handleRangeCardSelect,
    handleAddSelectedVoucherCard,
    handleAddRange,
  };
}

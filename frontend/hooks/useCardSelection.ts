import { useState } from "react";
import { getCardsByType } from "@/lib/services/card.service";
import { getCategoryByName } from "@/lib/services/category.service";
import { getAppConfig } from "@/lib/services/config.service";
import axios from "@/lib/axios";
import type {
  CardCategory,
  CardType,
  Card,
  CardStatus,
} from "@/types/purchase";
import { toast } from "sonner";

export function useCardSelection() {
  const [cardCategory, setCardCategory] = useState<CardCategory | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryCode, setCategoryCode] = useState<string>("");
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [cardTypeId, setCardTypeId] = useState("");
  const [typeCode, setTypeCode] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [cardId, setCardId] = useState("");
  const [price, setPrice] = useState(0);
  const [cardProducts, setCardProducts] = useState<any[]>([]);
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  const handleCategoryChange = async (category: CardCategory) => {
    try {
      setCardCategory(category);
      setCardTypeId("");
      setCardId("");
      setCards([]);
      setPrice(0);

      const categoryData = await getCategoryByName(category);
      if (!categoryData) {
        throw new Error("Category not found");
      }

      setCategoryId(categoryData.id);
      setCategoryCode(categoryData.categoryCode || "");

      // Reset serial number prefix when category changes
      setSerialNumber("");

      setLoadingTypes(true);
      // Ambil semua card products
      const response = await axios.get("/card/product");
      const allProducts = response.data.data || [];

      // Filter products berdasarkan categoryId (karena backend tidak support filter)
      const products = allProducts.filter(
        (product: any) => product.categoryId === categoryData.id,
      );

      // Simpan products untuk referensi price nanti
      setCardProducts(products);

      // Ekstrak unique card types dari products
      const uniqueTypes = products.reduce((acc: CardType[], product: any) => {
        if (product.type && !acc.find((t) => t.id === product.type.id)) {
          acc.push(product.type);
        }
        return acc;
      }, []);

      setCardTypes(uniqueTypes);

      if (uniqueTypes.length === 0) {
        toast.warning("Tidak ada card type tersedia untuk kategori ini");
      }
    } catch (error) {
      toast.error("Gagal memuat card types");
      console.error(error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleTypeChange = async (typeId: string) => {
    try {
      setCardTypeId(typeId);
      setCardId("");

      if (!typeId) {
        setCards([]);
        setPrice(0);
        setTypeCode("");
        setSerialNumber("");
        return;
      }

      // Set price berdasarkan card product yang sesuai dengan typeId
      const matchedProduct = cardProducts.find(
        (product: any) => product.type?.id === typeId,
      );
      if (matchedProduct) {
        setPrice(Number(matchedProduct.price) || 0);
      }

      // Get typeCode from selected type
      const selectedType = cardTypes.find((t) => t.id === typeId);
      const currentTypeCode = selectedType?.typeCode || "";
      setTypeCode(currentTypeCode);

      // Use serialTemplate from card product (already formatted as 4 digits)
      const serialTemplate = matchedProduct?.serialTemplate || "";

      // Auto-generate serial number prefix: serialTemplate only
      setSerialNumber(serialTemplate);
      setSearchResults([]);

      setLoadingCards(true);

      const config = await getAppConfig();
      const availableStatus = config.cardStatus.available as CardStatus;

      const availableCards = await getCardsByType(
        categoryId,
        typeId,
        availableStatus,
      );

      setCards(availableCards);

      if (availableCards.length === 0) {
        toast.warning("Tidak ada kartu tersedia untuk tipe ini");
      }
    } catch (error) {
      toast.error("Gagal memuat kartu");
      console.error(error);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleCardSearch = async (query: string) => {
    setSerialNumber(query);

    // Need at least 6 characters to search (serialTemplate is 4 digits + at least 2 more digits)
    if (!query || query.length < 6) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);

      const config = await getAppConfig();
      const availableStatus = config.cardStatus.available as CardStatus;

      // Search cards by serial number with optional filters
      const params: any = {
        search: query,
        status: availableStatus,
        limit: 10,
        sortBy: "serialNumber",
        sortOrder: "asc",
      };

      // Add filters only if category and type are selected
      if (categoryId) params.categoryId = categoryId;
      if (cardTypeId) params.typeId = cardTypeId;

      const response = await axios.get("/cards", { params });

      const results = response.data?.data?.items || [];
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching cards:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCardSelect = (card: Card) => {
    setCardId(card.id);
    setSerialNumber(card.serialNumber);
    setSearchResults([]);
  };

  const handleCardChange = (id: string) => {
    setCardId(id);
  };

  const resetSelection = () => {
    setCardCategory("");
    setCategoryId("");
    setCategoryCode("");
    setCardTypes([]);
    setCardTypeId("");
    setTypeCode("");
    setCards([]);
    setCardId("");
    setPrice(0);
    setSerialNumber("");
    setSearchResults([]);
  };

  return {
    cardCategory,
    categoryId,
    categoryCode,
    cardTypes,
    cardTypeId,
    typeCode,
    cards,
    cardId,
    price,
    serialNumber,
    setSerialNumber,
    searchResults,
    isSearching,
    loadingTypes,
    loadingCards,
    handleCategoryChange,
    handleTypeChange,
    handleCardChange,
    handleCardSearch,
    handleCardSelect,
    resetSelection,
  };
}

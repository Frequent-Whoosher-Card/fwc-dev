import { useState, useEffect } from "react";
import { getCategories } from "@/lib/services/category.service";
import type { CardCategory } from "@/types/purchase";
import { toast } from "sonner";

export interface CategoryOption {
  value: CardCategory;
  label: string;
  id: string;
}

/**
 * Hook to load and manage card categories dynamically from API
 */
export function useCategories() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();

        const options: CategoryOption[] = data.map((cat) => ({
          value: cat.categoryName.toUpperCase() as CardCategory,
          label: cat.categoryName,
          id: cat.id,
        }));

        setCategories(options);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load categories:", err);
        setError(err.message || "Gagal memuat kategori");
        toast.error(err.message || "Gagal memuat kategori kartu");

        setCategories([
          { value: "GOLD", label: "Gold", id: "gold" },
          { value: "SILVER", label: "Silver", id: "silver" },
          { value: "KAI", label: "KAI", id: "kai" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  console.log("Loaded categories:", categories);

  return { categories, loading, error };
}

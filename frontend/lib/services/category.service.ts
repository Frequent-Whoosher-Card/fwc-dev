import axios from "@/lib/axios";
import type { CardCategory } from "@/types/purchase";

export interface CategoryWithPrice {
  id: string;
  categoryName: CardCategory;
  price: number;
  description?: string;
}

export interface CategoryResponse {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
}

/**
 * Get all card categories from API
 */
export async function getCategories(): Promise<CategoryResponse[]> {
  const response = await axios.get("/card/category");
  return response.data.data || [];
}

/**
 * Get category by name
 */
export async function getCategoryByName(
  name: string,
): Promise<CategoryResponse | null> {
  const categories = await getCategories();
  return (
    categories.find(
      (c) => c.categoryName.toUpperCase() === name.toUpperCase(),
    ) || null
  );
}

/**
 * Get price for a category from card products
 * This fetches the actual price from the first card product in the category
 */
export async function getCategoryPrice(categoryId: string): Promise<number> {
  try {
    const response = await axios.get("/card/product");
    const allProducts = response.data.data || [];
    // Filter by categoryId karena backend tidak support filter
    const products = allProducts.filter(
      (p: any) => p.categoryId === categoryId,
    );
    return products[0]?.price ? Number(products[0].price) : 0;
  } catch (error) {
    console.error("Error fetching category price:", error);
    return 0;
  }
}

/**
 * Get all categories with their prices
 */
export async function getCategoriesWithPrices(): Promise<CategoryWithPrice[]> {
  const categories = await getCategories();
  const categoriesWithPrices = await Promise.all(
    categories.map(async (category) => {
      const price = await getCategoryPrice(category.id);
      return {
        id: category.id,
        categoryName: category.categoryName as CardCategory,
        price,
        description: category.description,
      };
    }),
  );
  return categoriesWithPrices;
}

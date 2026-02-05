/**
 * Splits a comma-separated string into an array of strings.
 * Trims whitespace. Returns undefined if the string is empty.
 * Example: "A, B, C" -> ["A", "B", "C"]
 */
export function parseFilter(value?: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

/**
 * Constructs a Prisma 'in' filter object if the value exists.
 * Returns undefined otherwise.
 * Example: "A,B" -> { in: ["A", "B"] }
 */
export function prismaFilter(value?: string | null) {
  const parsed = parseFilter(value);
  return parsed ? { in: parsed } : undefined;
}

/**
 * Constructs a Smart Search Prisma Condition.
 * It takes a search string like "foo bar" and an array of field names.
 * It returns an AND condition where EACH term must match AT LEAST ONE of the fields (OR).
 *
 * Example: search="foo bar", fields=["name", "desc"]
 * Result:
 * {
 *   AND: [
 *     { OR: [{ name: { contains: "foo", mode: "insensitive" } }, { desc: { contains: "foo", mode: "insensitive" } }] },
 *     { OR: [{ name: { contains: "bar", mode: "insensitive" } }, { desc: { contains: "bar", mode: "insensitive" } }] }
 *   ]
 * }
 */
export function parseSmartSearch(search: string, fields: string[]) {
  if (!search) return undefined;

  const terms = search.split(/\s+/).filter(Boolean); // Split by whitespace
  if (terms.length === 0) return undefined;

  const andConditions = terms.map((term) => {
    // Each term must match at least one field
    return {
      OR: fields.map((field) => {
        // Handle nested relations like "station.stationName"
        // Handle nested relations like "station.stationName" or "cardProduct.category.categoryName"
        if (field.includes(".")) {
          const parts = field.split(".");
          // Construct nested object from right to left, or recursively
          // Example: "a.b.c" -> { a: { b: { c: { contains: term } } } }

          let nestedQuery: any = {
            [parts[parts.length - 1]]: { contains: term, mode: "insensitive" },
          };

          for (let i = parts.length - 2; i >= 0; i--) {
            nestedQuery = { [parts[i]]: nestedQuery };
          }

          return nestedQuery;
        }

        return {
          [field]: { contains: term, mode: "insensitive" },
        };
      }),
    };
  });

  return { AND: andConditions };
}

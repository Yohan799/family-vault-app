/**
 * Unified search utility for filtering vault items
 */

/**
 * Normalizes text for case-insensitive, whitespace-tolerant matching
 */
const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Checks if a search query matches any of the provided values
 */
const matchesQuery = (query: string, values: (string | undefined | null)[]): boolean => {
  const normalizedQuery = normalizeText(query);
  return values.some(value => {
    if (!value) return false;
    return normalizeText(value).includes(normalizedQuery);
  });
};

/**
 * Parses flexible date formats for search
 * Supports: "2024", "Jan 2024", "12 Jan", "29/11", etc.
 */
export const matchesDate = (dateString: string, query: string): boolean => {
  const normalizedQuery = normalizeText(query);
  const normalizedDate = normalizeText(dateString);
  
  // Direct match
  if (normalizedDate.includes(normalizedQuery)) return true;
  
  // Parse various date formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  const year = date.getFullYear().toString();
  const month = date.toLocaleString('default', { month: 'short' }).toLowerCase();
  const monthLong = date.toLocaleString('default', { month: 'long' }).toLowerCase();
  const day = date.getDate().toString();
  
  // Check against various formats
  if (year.includes(normalizedQuery)) return true;
  if (month.includes(normalizedQuery)) return true;
  if (monthLong.includes(normalizedQuery)) return true;
  if (day.includes(normalizedQuery)) return true;
  if (`${day}/${date.getMonth() + 1}`.includes(normalizedQuery)) return true;
  if (`${month} ${year}`.includes(normalizedQuery)) return true;
  
  return false;
};

/**
 * Extracts file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * Generic filter function for any items based on searchable keys
 */
export function filterItems<T extends Record<string, any>>(
  items: T[],
  query: string,
  config: {
    searchKeys: (keyof T)[];
    dateKeys?: (keyof T)[];
    filenameKeys?: (keyof T)[];
  }
): T[] {
  if (!query.trim()) return items;

  const normalizedQuery = normalizeText(query);

  return items.filter(item => {
    // Check regular text fields
    const textMatch = matchesQuery(
      normalizedQuery,
      config.searchKeys.map(key => String(item[key]))
    );
    
    if (textMatch) return true;

    // Check date fields
    if (config.dateKeys) {
      const dateMatch = config.dateKeys.some(key => {
        const dateValue = item[key];
        if (!dateValue) return false;
        return matchesDate(String(dateValue), normalizedQuery);
      });
      if (dateMatch) return true;
    }

    // Check filename with extension
    if (config.filenameKeys) {
      const extensionMatch = config.filenameKeys.some(key => {
        const filename = String(item[key]);
        const extension = getFileExtension(filename);
        return extension.includes(normalizedQuery);
      });
      if (extensionMatch) return true;
    }

    return false;
  });
}

/**
 * Filters categories by name and checks if any subcategories or documents match
 */
export function filterCategoriesWithNested<T extends { name: string; id: string }>(
  categories: T[],
  query: string,
  getSubcategories: (categoryId: string) => any[],
  getDocuments: (categoryId: string) => any[]
): T[] {
  if (!query.trim()) return categories;

  return categories.filter(category => {
    // Check category name
    if (matchesQuery(query, [category.name])) return true;

    // Check subcategories
    const subcategories = getSubcategories(category.id);
    const hasMatchingSubcategory = subcategories.some(sub =>
      matchesQuery(query, [sub.name])
    );
    if (hasMatchingSubcategory) return true;

    // Check documents
    const documents = getDocuments(category.id);
    const hasMatchingDocument = filterItems(documents, query, {
      searchKeys: ['name', 'file_name'],
      dateKeys: ['date', 'uploaded_at'],
      filenameKeys: ['name', 'file_name']
    }).length > 0;

    return hasMatchingDocument;
  });
}

/**
 * Debounce utility for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
export const TCGCSV_BASE_URL = 'https://tcgcsv.com/tcgplayer';

export const CATEGORY_IDS = {
  mtg: 1,
  pokemon: 3,
};

export async function fetchGroups(categoryId: number) {
  try {
    const res = await fetch(`/api/tcgcsv/groups?categoryId=${categoryId}`);
    if (!res.ok) throw new Error('Failed to fetch groups');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

export async function fetchProducts(categoryId: number, groupId: number) {
  try {
    // TODO: Create API route for products to bypass CORS too
    const res = await fetch(`/api/tcgcsv/products?categoryId=${categoryId}&groupId=${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function fetchPrices(categoryId: number, groupId: number) {
  try {
    // TODO: Create API route for prices to bypass CORS too
    const res = await fetch(`/api/tcgcsv/prices?categoryId=${categoryId}&groupId=${groupId}`);
    if (!res.ok) throw new Error('Failed to fetch prices');
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching prices:", error);
    return [];
  }
}

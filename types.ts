export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
}

export interface CategoryField {
  key: string;
  label: string;
  type: FieldType;
  unit?: string; // e.g., "g", "mm", "cm"
}

export interface Category {
  id: string;
  name: string; // e.g., "Ring", "Necklace"
  fields: CategoryField[];
}

export interface Product {
  id: string;
  name: string; // e.g., "Three Lives Three Worlds"
  categoryId: string;
  createdAt: number;
}

export enum ListingStatus {
  LISTED = 'LISTED', // On TikTok/Douyin
  UNLISTED = 'UNLISTED',
}

// Represents a unique SKU variant (e.g. Ring A, Size 18, 2g, Listed)
export interface StockItem {
  id: string;
  productId: string;
  listingStatus: ListingStatus;
  quantity: number; // Consolidates identical items
  customValues: Record<string, string | number>; // Stores dynamic field data (e.g. weight: 2.5)
  updatedAt: number;
}

export interface OperationLog {
  id: string;
  productId: string;
  type: 'IN' | 'OUT'; // Inbound or Outbound
  quantity: number;
  customValues: Record<string, string | number>;
  details: string; // Snapshot of attributes (e.g., "圈口:18, 克重:2.5g")
  listingStatus: ListingStatus;
  timestamp: number;
}

export interface User {
  username: string;
}

// Helper type for export selection
export interface ExportSelection {
  [productId: string]: boolean;
}
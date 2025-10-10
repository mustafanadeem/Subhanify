export interface AdhkarItem {
  Category: string;
  Adhkar: string;
  Arabic: string;
  transliteration: string;
  translation: string | number; // Can be NaN
  virtue: string;
  reference: string;
  quantity: number;
  Level: number;
}

export interface AdhkarData {
  Sheet1: AdhkarItem[];
}

export interface CategorySummary {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  category: string;
}



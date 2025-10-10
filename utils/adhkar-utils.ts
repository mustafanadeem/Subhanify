import adhkarData from "@/data/adkar_dua.json";
import { AdhkarData, AdhkarItem, CategorySummary } from "@/types/adhkar";

const data: AdhkarData = adhkarData as AdhkarData;

// Get all adhkar by category
export const getAdhkarByCategory = (category: string): AdhkarItem[] => {
  return data.Sheet1.filter(
    (item) => item.Category.trim().toLowerCase() === category.toLowerCase()
  );
};

// Get unique categories
export const getCategories = (): string[] => {
  const categories = data.Sheet1.map((item) => item.Category.trim().toLowerCase());
  return Array.from(new Set(categories));
};

// Get category count
export const getCategoryCount = (category: string): number => {
  return getAdhkarByCategory(category).length;
};

// Category mapping for display
const categoryDisplayInfo: Record<string, CategorySummary> = {
  morning: {
    id: "morning",
    title: "Morning",
    subtitle: "Adhkar Al-Sabah",
    icon: "sunrise.fill",
    count: getCategoryCount("morning"),
    category: "morning",
  },
  evening: {
    id: "evening",
    title: "Evening",
    subtitle: "Adhkar Al-Masaa",
    icon: "sunset.fill",
    count: getCategoryCount("evening"),
    category: "evening",
  },
};

// Get all adhkar categories for the home screen
export const getAdhkarCategories = (): CategorySummary[] => {
  return Object.values(categoryDisplayInfo);
};

// For duas, you can add separate logic when you have duas data
export const duasCategories: CategorySummary[] = [
  {
    id: "1",
    title: "Daily Duas",
    subtitle: "Everyday supplications",
    icon: "sun.max.fill",
    count: 5,
    category: "daily",
  },
  {
    id: "2",
    title: "Traveling",
    subtitle: "For journeys",
    icon: "airplane",
    count: 3,
    category: "travel",
  },
  {
    id: "3",
    title: "Health",
    subtitle: "Healing prayers",
    icon: "heart.fill",
    count: 4,
    category: "health",
  },
  {
    id: "4",
    title: "Protection",
    subtitle: "Divine safeguarding",
    icon: "shield.fill",
    count: 2,
    category: "protection",
  },
  {
    id: "5",
    title: "Gratitude",
    subtitle: "Thanks to Allah",
    icon: "hands.sparkles.fill",
    count: 3,
    category: "gratitude",
  },
];



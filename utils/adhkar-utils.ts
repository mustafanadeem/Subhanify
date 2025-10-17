import adhkarData from "@/data/adkar_dua.json";
import duasData from "@/data/duas.json";
import { AdhkarData, AdhkarItem, CategorySummary, DuaItem } from "@/types/adhkar";

const data: AdhkarData = adhkarData as AdhkarData;
const duas: DuaItem[] = duasData as DuaItem[];

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

// === DUAS FUNCTIONS ===

// Get all duas by category
export const getDuasByCategory = (category: string): DuaItem[] => {
  // Map category keys to dua IDs from the JSON
  const categoryMapping: Record<string, string[]> = {
    home: ["leaving-house", "entering-house"],
    mosque: ["entering-mosque", "leaving-mosque"],
    rain: ["rain", "beneficial-rain"],
    travel: ["travel", "destination"],
  };

  const duaIds = categoryMapping[category.toLowerCase()] || [];
  return duas.filter((dua) => duaIds.includes(dua.id));
};

// Get category count for duas
export const getDuaCategoryCount = (category: string): number => {
  return getDuasByCategory(category).length;
};

// Category mapping for duas display
const duaCategoryDisplayInfo: Record<string, CategorySummary> = {
  home: {
    id: "home",
    title: "Home",
    subtitle: "Entering & leaving",
    icon: "house.fill",
    count: getDuaCategoryCount("home"),
    category: "home",
  },
  mosque: {
    id: "mosque",
    title: "Mosque",
    subtitle: "Entering & leaving",
    icon: "building.columns.fill",
    count: getDuaCategoryCount("mosque"),
    category: "mosque",
  },
  rain: {
    id: "rain",
    title: "Rain",
    subtitle: "When it rains",
    icon: "cloud.rain.fill",
    count: getDuaCategoryCount("rain"),
    category: "rain",
  },
  travel: {
    id: "travel",
    title: "Travel",
    subtitle: "Journey supplications",
    icon: "car.fill",
    count: getDuaCategoryCount("travel"),
    category: "travel",
  },
};

// Get all duas categories for the home screen
export const getDuasCategories = (): CategorySummary[] => {
  return Object.values(duaCategoryDisplayInfo);
};



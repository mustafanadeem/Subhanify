import adhkarData from "@/data/adkar_dua.json";
import duasData from "@/data/duas.json";
import { AdhkarLevel, getLevelSettings } from "@/services/level-settings-service";
import { AdhkarData, AdhkarItem, CategorySummary, DuaItem } from "@/types/adhkar";

const data: AdhkarData = adhkarData as AdhkarData;
const duas: DuaItem[] = duasData as DuaItem[];

export const getAdhkarByCategory = async (category: string): Promise<AdhkarItem[]> => {
  const levelSettings = await getLevelSettings();
  
  const categoryAdhkar = data.Sheet1.filter(
    (item) => item.Category.trim().toLowerCase() === category.toLowerCase()
  );
  
  if (!levelSettings.enabled) {
    return categoryAdhkar;
  }
  
  return categoryAdhkar.filter((item) => {
    const adhkarLevel = item.Level || 1;
    return adhkarLevel <= levelSettings.currentLevel;
  });
};

export const getAdhkarByCategoryAndLevel = (
  category: string,
  level: AdhkarLevel
): AdhkarItem[] => {
  return data.Sheet1.filter(
    (item) =>
      item.Category.trim().toLowerCase() === category.toLowerCase() &&
      (item.Level || 1) <= level
  );
};

// Get unique categories
export const getCategories = (): string[] => {
  const categories = data.Sheet1.map((item) => item.Category.trim().toLowerCase());
  return Array.from(new Set(categories));
};

export const getCategoryCount = (category: string): number => {
  return data.Sheet1.filter(
    (item) => item.Category.trim().toLowerCase() === category.toLowerCase()
  ).length;
};

// Get category count filtered by level
export const getCategoryCountByLevel = (
  category: string,
  level: AdhkarLevel
): number => {
  return getAdhkarByCategoryAndLevel(category, level).length;
};

// Category mapping for display (without level filtering)
const baseCategoryDisplayInfo: Record<string, Omit<CategorySummary, 'count'>> = {
  morning: {
    id: "morning",
    title: "Morning",
    subtitle: "Adhkar Al-Sabah",
    icon: "sunrise.fill",
    category: "morning",
  },
  evening: {
    id: "evening",
    title: "Evening",
    subtitle: "Adhkar Al-Masaa",
    icon: "sunset.fill",
    category: "evening",
  },
  night: {
    id: "night",
    title: "Night",
    subtitle: "Before Sleep",
    icon: "moon.stars.fill",
    category: "night",
  },
};

export const getAdhkarCategories = async (): Promise<CategorySummary[]> => {
  const levelSettings = await getLevelSettings();
  
  return Object.values(baseCategoryDisplayInfo).map((category) => {
    const count = levelSettings.enabled
      ? getCategoryCountByLevel(category.category, levelSettings.currentLevel)
      : getCategoryCount(category.category);
    
    return {
      ...category,
      count,
    };
  });
};

// Duas utilities
export const getAllDuas = (): DuaItem[] => {
  return duas;
};

export const getDuaById = (id: string): DuaItem | undefined => {
  return duas.find((dua) => dua.id === id);
};

// Category mapping for duas based on the actual data
const duaCategoryMapping: Record<string, { title: string; subtitle: string; icon: string; duaIds: string[] }> = {
  home: {
    title: "Home",
    subtitle: "Entering & leaving",
    icon: "house.fill",
    duaIds: ["leaving-house", "entering-house"],
  },
  mosque: {
    title: "Mosque",
    subtitle: "Sacred spaces",
    icon: "moon.fill",
    duaIds: ["entering-mosque", "leaving-mosque"],
  },
  travel: {
    title: "Travel",
    subtitle: "For journeys",
    icon: "airplane",
    duaIds: ["travel", "destination"],
  },
  weather: {
    title: "Weather",
    subtitle: "Rain supplications",
    icon: "cloud.rain.fill",
    duaIds: ["rain", "beneficial-rain"],
  },
};

export const getDuasCategories = (): CategorySummary[] => {
  return Object.entries(duaCategoryMapping).map(([category, info]) => ({
    id: category,
    title: info.title,
    subtitle: info.subtitle,
    icon: info.icon,
    count: info.duaIds.length,
    category,
  }));
};

export const getDuasByCategory = (category: string): DuaItem[] => {
  const categoryInfo = duaCategoryMapping[category];
  if (!categoryInfo) return [];
  
  return categoryInfo.duaIds
    .map((id) => duas.find((dua) => dua.id === id))
    .filter((dua): dua is DuaItem => dua !== undefined);
};



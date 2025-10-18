import adhkarData from "@/data/adkar_dua.json";
import { AdhkarLevel, getLevelSettings } from "@/services/level-settings-service";
import { AdhkarData, AdhkarItem, CategorySummary } from "@/types/adhkar";

const data: AdhkarData = adhkarData as AdhkarData;

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



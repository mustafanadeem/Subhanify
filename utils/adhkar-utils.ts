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

// Category display configuration with icons and subtitles
const duaCategoryDisplayInfo: Record<string, { title: string; subtitle: string; icon: string }> = {
  "Home": {
    title: "Home",
    subtitle: "Entering & leaving",
    icon: "house.fill",
  },
  "Mosque": {
    title: "Mosque",
    subtitle: "Sacred spaces",
    icon: "moon.fill",
  },
  "Travel": {
    title: "Travel",
    subtitle: "For journeys",
    icon: "airplane",
  },
  "Weather": {
    title: "Weather",
    subtitle: "Rain supplications",
    icon: "cloud.rain.fill",
  },
  "Ablution": {
    title: "Ablution",
    subtitle: "Wudu supplications",
    icon: "drop.fill",
  },
  "Bathing & Hygiene": {
    title: "Bathing & Hygiene",
    subtitle: "Bathroom duas",
    icon: "water.waves",
  },
  "Clothing": {
    title: "Clothing",
    subtitle: "Wearing garments",
    icon: "tshirt.fill",
  },
  "Salah": {
    title: "Salah",
    subtitle: "Prayer duas",
    icon: "person.fill",
  },
  "Morning & Evening": {
    title: "Morning & Evening",
    subtitle: "Daily remembrance",
    icon: "sun.horizon.fill",
  },
  "Sleep": {
    title: "Sleep",
    subtitle: "Before sleeping",
    icon: "moon.zzz.fill",
  },
  "Protection": {
    title: "Protection",
    subtitle: "Seeking refuge",
    icon: "shield.fill",
  },
  "Hardship & Distress": {
    title: "Hardship & Distress",
    subtitle: "In difficult times",
    icon: "heart.fill",
  },
  "Faith & Spirituality": {
    title: "Faith & Spirituality",
    subtitle: "Spiritual guidance",
    icon: "sparkles",
  },
  "Life Guidance": {
    title: "Life Guidance",
    subtitle: "Daily guidance",
    icon: "book.fill",
  },
  "Other": {
    title: "Other",
    subtitle: "Miscellaneous duas",
    icon: "ellipsis.circle.fill",
  },
};

// Helper to convert category name to key
function categoryToKey(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const getDuasCategories = (): CategorySummary[] => {
  // Get all unique categories from duas
  const categories = new Set<string>();
  duas.forEach((dua) => {
    if (dua.category) {
      categories.add(dua.category);
    }
  });

  // Build category summaries
  return Array.from(categories)
    .map((category) => {
      const key = categoryToKey(category);
      const displayInfo = duaCategoryDisplayInfo[category] || {
        title: category,
        subtitle: `${category} duas`,
        icon: "ellipsis.circle.fill",
      };

      const count = duas.filter(
        (dua) => dua.category && dua.category === category
      ).length;

      return {
        id: key,
        title: displayInfo.title,
        subtitle: displayInfo.subtitle,
        icon: displayInfo.icon,
        count,
        category: key,
      };
    })
    .sort((a, b) => {
      // Sort by count (descending), then alphabetically
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.title.localeCompare(b.title);
    });
};

export const getDuasByCategory = (categoryKey: string): DuaItem[] => {
  // Normalize the category key (handle both the key format and direct category name)
  const normalizedKey = categoryKey.toLowerCase().trim();
  
  // First, try to find exact match by key
  const categoryMap = new Map<string, string>();
  const reverseMap = new Map<string, string>(); // category name -> key
  
  duas.forEach((dua) => {
    if (dua.category) {
      const key = categoryToKey(dua.category);
      if (!categoryMap.has(key)) {
        categoryMap.set(key, dua.category);
      }
      // Also create reverse mapping for direct category name lookup
      const categoryLower = dua.category.toLowerCase();
      if (!reverseMap.has(categoryLower)) {
        reverseMap.set(categoryLower, dua.category);
      }
    }
  });

  // Try to find category name
  let categoryName: string | undefined = categoryMap.get(normalizedKey);
  
  // If not found by key, try direct category name match
  if (!categoryName) {
    categoryName = reverseMap.get(normalizedKey);
  }
  
  // If still not found, try partial match (for cases like "salah-during-prayer")
  if (!categoryName) {
    for (const [key, name] of categoryMap.entries()) {
      if (key.includes(normalizedKey) || normalizedKey.includes(key)) {
        categoryName = name;
        break;
      }
    }
  }

  if (!categoryName) return [];

  return duas.filter(
    (dua) => dua.category && dua.category === categoryName
  );
};



import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ArabicFont = "Hafs" | "Saleen";

interface FontContextType {
  arabicFont: ArabicFont;
  setArabicFont: (font: ArabicFont) => Promise<void>;
  getFontFamily: () => string;
  arabicTextSize: number;
  setArabicTextSize: (size: number) => Promise<void>;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

const FONT_STORAGE_KEY = "@subhanify_arabic_font";
const ARABIC_TEXT_SIZE_KEY = "@subhanify_arabic_text_size";
const DEFAULT_ARABIC_TEXT_SIZE = 32;

// Map font names to their actual font family names
const FONT_MAP: Record<ArabicFont, string> = {
  Hafs: "Hafs-Regular",
  Saleen: "Saleen-Regular",
};

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [arabicFont, setArabicFontState] = useState<ArabicFont>("Hafs");
  const [arabicTextSize, setArabicTextSizeState] = useState<number>(
    DEFAULT_ARABIC_TEXT_SIZE
  );

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedFont, savedSize] = await Promise.all([
        AsyncStorage.getItem(FONT_STORAGE_KEY),
        AsyncStorage.getItem(ARABIC_TEXT_SIZE_KEY),
      ]);

      if (savedFont && (savedFont === "Hafs" || savedFont === "Saleen")) {
        setArabicFontState(savedFont as ArabicFont);
      }

      if (savedSize) {
        const size = parseInt(savedSize, 10);
        if (!isNaN(size) && size >= 14 && size <= 64) {
          setArabicTextSizeState(size);
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const setArabicFont = async (font: ArabicFont) => {
    try {
      await AsyncStorage.setItem(FONT_STORAGE_KEY, font);
      setArabicFontState(font);
    } catch (error) {
      console.error("Error saving font preference:", error);
    }
  };

  const setArabicTextSize = async (size: number) => {
    try {
      await AsyncStorage.setItem(ARABIC_TEXT_SIZE_KEY, size.toString());
      setArabicTextSizeState(size);
    } catch (error) {
      console.error("Error saving text size:", error);
    }
  };

  const getFontFamily = () => {
    return FONT_MAP[arabicFont];
  };

  return (
    <FontContext.Provider
      value={{
        arabicFont,
        setArabicFont,
        getFontFamily,
        arabicTextSize,
        setArabicTextSize,
      }}
    >
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

// Nominatim API response types
interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
  country?: string;
  state?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
  type: string;
  importance: number;
}

export interface PlaceSelection {
  label: string;
  latitude: number;
  longitude: number;
  raw: NominatimResult;
}

interface PlaceAutocompleteProps {
  onSelect: (place: PlaceSelection) => void;
  style?: ViewStyle;
  theme?: "light" | "dark";
  placeholder?: string;
  initialValue?: string;
}

/**
 * Custom hook for Nominatim geocoding with debouncing
 */
const useNominatimSearch = (query: string, delay: number = 300) => {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search if query is too short
    if (query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}` +
            `&format=json` +
            `&addressdetails=1` +
            `&limit=5`,
          {
            headers: {
              "User-Agent": "SubhanifyApp/1.0", // Required by Nominatim policy
            },
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data: NominatimResult[] = await response.json();
        console.log(`[PlaceAutocomplete] Found ${data.length} results for "${query}"`);
        setResults(data);
        setError(null);
      } catch (err) {
        console.error("Nominatim search error:", err);
        setError("Failed to fetch location suggestions");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay]);

  return { results, isLoading, error };
};

/**
 * Extract human-readable location info from Nominatim address
 */
const formatAddress = (result: NominatimResult): { main: string; secondary: string } => {
  const addr = result.address;
  
  // Main text: road name or first part of display_name
  let main = addr?.road || result.display_name.split(",")[0];
  if (addr?.house_number) {
    main = `${addr.house_number} ${main}`;
  }

  // Secondary text: city, postcode
  const parts: string[] = [];
  const city = addr?.city || addr?.town || addr?.village;
  if (city) parts.push(city);
  if (addr?.postcode) parts.push(addr.postcode);
  if (parts.length === 0 && addr?.country) parts.push(addr.country);
  
  const secondary = parts.length > 0 
    ? parts.join(", ")
    : result.display_name.split(",").slice(1, 3).join(",").trim();

  return { main, secondary };
};

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  onSelect,
  style,
  theme = "light",
  placeholder = "Search for a place...",
  initialValue = "",
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { results, isLoading, error } = useNominatimSearch(searchText);

  const isDark = theme === "dark";

  // Sync searchText with initialValue changes
  useEffect(() => {
    setSearchText(initialValue);
  }, [initialValue]);

  // Animate suggestions appearance
  useEffect(() => {
    if (showSuggestions && results.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuggestions, results.length]);

  // Show suggestions when we have results and input is focused
  useEffect(() => {
    setShowSuggestions(results.length > 0 && isFocused);
  }, [results.length, isFocused]);

  const handleTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSuggestionPress = useCallback(
    (result: NominatimResult) => {
      const { main } = formatAddress(result);
      console.log('[PlaceAutocomplete] Suggestion pressed:', main);
      setSearchText(main);
      setShowSuggestions(false);
      Keyboard.dismiss();

      // Call the parent's onSelect with structured data
      const selection = {
        label: main,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        raw: result,
      };
      console.log('[PlaceAutocomplete] Calling onSelect with:', selection);
      onSelect(selection);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setSearchText("");
    setShowSuggestions(false);
  }, []);

  const colors = {
    background: isDark ? "#1C1C1E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#8E8E93" : "#A0A0A0",
    border: isDark ? "#3A3A3C" : "#E5E5EA",
    shadow: isDark ? "#000000" : "#000000",
    suggestionBg: isDark ? "#2C2C2E" : "#F9F9F9",
    suggestionHover: isDark ? "#3A3A3C" : "#F0F0F0",
    secondaryText: isDark ? "#8E8E93" : "#6C6C70",
    iconColor: isDark ? "#8E8E93" : "#A0A0A0",
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Input */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderColor: isFocused ? "#007AFF" : colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.iconColor}
          style={styles.searchIcon}
        />
        
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => {
            console.log('[PlaceAutocomplete] Input focused');
            setIsFocused(true);
          }}
          onBlur={() => {
            console.log('[PlaceAutocomplete] Input blurred, hiding suggestions in 500ms');
            // Delay to allow tap on suggestion
            setTimeout(() => setIsFocused(false), 500);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Right side icons: loading spinner or clear button */}
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={styles.rightIcon}
          />
        ) : searchText.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.rightIcon}>
            <Ionicons name="close-circle" size={20} color={colors.iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Error message */}
      {error && (
        <Text style={[styles.errorText, { color: "#FF3B30" }]}>{error}</Text>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && results.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              opacity: fadeAnim,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={false}
          >
            {results.map((item, index) => {
              const { main, secondary } = formatAddress(item);
              return (
                <TouchableOpacity
                  key={item.place_id.toString()}
                  style={[
                    styles.suggestionItem,
                    {
                      backgroundColor: colors.suggestionBg,
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < results.length - 1 ? 0.5 : 0,
                    },
                  ]}
                  onPress={() => {
                    console.log('[PlaceAutocomplete] TouchableOpacity pressed for:', item.display_name);
                    handleSuggestionPress(item);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="location"
                      size={20}
                      color="#007AFF"
                    />
                  </View>
                  
                  <View style={styles.textContainer}>
                    <Text
                      style={[styles.mainText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {main}
                    </Text>
                    <Text
                      style={[styles.secondaryText, { color: colors.secondaryText }]}
                      numberOfLines={1}
                    >
                      {secondary}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.iconColor}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: "400",
  },
});


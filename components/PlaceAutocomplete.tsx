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

// Google Places API response types
interface GooglePlacePrediction {
  place_id: string;
  description: string;
  main_text?: string;
  secondary_text?: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
  types: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  matched_substrings?: Array<{
    length: number;
    offset: number;
  }>;
}

interface GooglePlacesResponse {
  predictions: GooglePlacePrediction[];
  status: string;
}

interface GooglePlaceDetailsResponse {
  result: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  };
  status: string;
}

export interface PlaceSelection {
  label: string;
  latitude: number;
  longitude: number;
  raw: GooglePlacePrediction;
}

interface PlaceAutocompleteProps {
  onSelect: (place: PlaceSelection) => void;
  style?: ViewStyle;
  theme?: "light" | "dark";
  placeholder?: string;
  initialValue?: string;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
}

/**
 * Custom hook for Google Places Autocomplete with debouncing
 * Restricted to UK locations
 */
const useGooglePlacesSearch = (query: string, delay: number = 300) => {
  const [results, setResults] = useState<GooglePlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Try both API key env vars
  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  // Log on mount to verify key is available
  useEffect(() => {
    if (!apiKey) {
      console.warn("[useGooglePlacesSearch] No API key found!");
      console.log(
        "[useGooglePlacesSearch] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:",
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? "✓ set" : "✗ not set"
      );
      console.log(
        "[useGooglePlacesSearch] EXPO_PUBLIC_GOOGLE_PLACES_API_KEY:",
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ? "✓ set" : "✗ not set"
      );
    }
  }, [apiKey]);

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

    if (!apiKey) {
      setError("Google Places API key not configured");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
          `input=${encodeURIComponent(query)}` +
          `&key=${apiKey}` +
          `&components=country:uk` +
          `&language=en` +
          `&sessiontoken=${Date.now()}`;

        console.log(
          "[PlaceAutocomplete] Fetching from:",
          url.substring(0, 100) + "..."
        );

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: GooglePlacesResponse = await response.json();

        console.log(
          `[PlaceAutocomplete] Full API Response:`,
          JSON.stringify(data).substring(0, 500)
        );
        console.log(`[PlaceAutocomplete] API Response status: ${data.status}`);
        console.log(
          `[PlaceAutocomplete] Found ${
            data.predictions?.length || 0
          } predictions`
        );

        if (data.predictions && data.predictions.length > 0) {
          console.log(
            "[PlaceAutocomplete] First prediction object:",
            JSON.stringify(data.predictions[0], null, 2).substring(0, 500)
          );
          data.predictions.slice(0, 3).forEach((p, i) => {
            const mainText =
              p.structured_formatting?.main_text || p.main_text || "N/A";
            const secondaryText =
              p.structured_formatting?.secondary_text ||
              p.secondary_text ||
              "N/A";
            console.log(
              `  [${i}] main_text: "${mainText}", secondary: "${secondaryText}"`
            );
          });
        }

        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          setResults(data.predictions || []);
          setError(null);
        } else if (data.status === "INVALID_REQUEST") {
          setError("Invalid search request");
          setResults([]);
        } else if (data.status === "REQUEST_DENIED") {
          setError("Google Places API key not valid");
          setResults([]);
        } else {
          setError(`API status: ${data.status}`);
          setResults([]);
        }
      } catch (err) {
        console.error("Google Places search error:", err);
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
  }, [query, delay, apiKey]);

  return { results, isLoading, error };
};

/**
 * Get detailed coordinates for a place using Google Place Details API
 */
const getPlaceDetails = async (
  placeId: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}` +
        `&fields=geometry` +
        `&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to get place details");
    }

    const data: GooglePlaceDetailsResponse = await response.json();

    if (data.status === "OK" && data.result.geometry) {
      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
      };
    }
    return null;
  } catch (err) {
    console.error("Error getting place details:", err);
    return null;
  }
};

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  onSelect,
  style,
  theme = "light",
  placeholder = "Search for a place...",
  initialValue = "",
  onSuggestionsVisibilityChange,
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isGettingDetails, setIsGettingDetails] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  const { results, isLoading, error } = useGooglePlacesSearch(searchText);

  const isDark = theme === "dark";

  // Log rendering info
  useEffect(() => {
    console.log("[PlaceAutocomplete] State:", {
      showSuggestions,
      isLoading,
      resultsCount: results.length,
      isFocused,
      shouldShowSuggestions:
        showSuggestions && (isLoading || results.length > 0),
    });
  }, [showSuggestions, isLoading, results.length, isFocused]);

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
  // BUT keep them visible for a bit after blur to allow tap
  useEffect(() => {
    if (results.length > 0 && isFocused) {
      setShowSuggestions(true);
      onSuggestionsVisibilityChange?.(true);
    } else if (!isFocused && results.length > 0) {
      // Don't hide immediately - the blur delay will handle this
      // This allows the tap to register before hiding
      const timer = setTimeout(() => {
        setShowSuggestions(false);
        onSuggestionsVisibilityChange?.(false);
      }, 600); // Slightly longer than blur delay
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
      onSuggestionsVisibilityChange?.(false);
    }
  }, [results.length, isFocused, onSuggestionsVisibilityChange]);

  const handleTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSuggestionPress = useCallback(
    async (prediction: GooglePlacePrediction) => {
      console.log("[PlaceAutocomplete] ✓ handleSuggestionPress FIRED");
      console.log("[PlaceAutocomplete] prediction:", {
        place_id: prediction.place_id,
        main_text: prediction.main_text,
        secondary_text: prediction.secondary_text,
        description: prediction.description,
      });

      // Use full description (formatted address) instead of just main_text
      console.log(
        "[PlaceAutocomplete] Setting search text to:",
        prediction.description
      );
      setSearchText(prediction.description);
      setShowSuggestions(false);
      Keyboard.dismiss();

      setIsGettingDetails(true);

      // Get detailed coordinates from Google Places Details API
      if (!apiKey) {
        console.error("API key not available");
        setIsGettingDetails(false);
        return;
      }

      const coordinates = await getPlaceDetails(prediction.place_id, apiKey);
      setIsGettingDetails(false);

      if (coordinates) {
        const selection: PlaceSelection = {
          label: prediction.description,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          raw: prediction,
        };
        console.log("[PlaceAutocomplete] Calling onSelect with:", selection);
        onSelect(selection);
      } else {
        console.warn("Could not get coordinates for selected place");
      }
    },
    [apiKey, onSelect]
  );

  const handleClear = useCallback(() => {
    setSearchText("");
    setShowSuggestions(false);
  }, []);

  const colors = {
    background: isDark ? "#1C1C1E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    placeholder: isDark ? "#A8A8A8" : "#C7C7CC",
    border: isDark ? "#38383A" : "#E5E5EA",
    suggestion: isDark ? "#2C2C2E" : "#F2F2F7",
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.placeholder}
          style={styles.icon}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          editable={!isGettingDetails}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.placeholder}
            />
          </TouchableOpacity>
        )}
        {(isLoading || isGettingDetails) && (
          <ActivityIndicator
            size="small"
            color={isDark ? "#FFF" : "#000"}
            style={styles.loader}
          />
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && (isLoading || results.length > 0) && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.suggestion,
            },
          ]}
        >
          {isLoading ? (
            <View
              style={{
                paddingVertical: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="small" color={colors.text} />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: colors.placeholder,
                }}
              >
                Loading suggestions...
              </Text>
            </View>
          ) : (
            <ScrollView
              scrollEnabled={results.length > 4}
              style={styles.suggestionsList}
            >
              {results.map((result, index) => (
                <TouchableOpacity
                  key={result.place_id}
                  onPress={() => handleSuggestionPress(result)}
                  style={[
                    styles.suggestionItem,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < results.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.placeholder}
                    style={styles.suggestionIcon}
                  />
                  <View style={styles.suggestionText}>
                    <Text
                      style={[
                        styles.mainText,
                        {
                          color: colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {result.structured_formatting?.main_text ||
                        result.main_text ||
                        result.description}
                    </Text>
                    {(result.structured_formatting?.secondary_text ||
                      result.secondary_text) && (
                      <Text
                        style={[
                          styles.secondaryText,
                          {
                            color: colors.placeholder,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {result.structured_formatting?.secondary_text ||
                          result.secondary_text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <Text
          style={[
            styles.errorText,
            {
              color: "#FF3B30",
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  loader: {
    marginLeft: 4,
  },
  suggestionsContainer: {
    borderRadius: 8,
    maxHeight: 300,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    marginTop: 8,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  suggestionIcon: {
    marginRight: 4,
  },
  suggestionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: "500",
  },
  secondaryText: {
    fontSize: 13,
    marginTop: 2,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
});

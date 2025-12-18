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
import { GOOGLE_PLACES_API_KEY } from "@/constants/api-keys";

// Google Places API response types
interface GooglePlacesPrediction {
  place_id: string;
  main_text: string;
  secondary_text?: string;
  description: string;
}

interface GooglePlacesDetails {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlaceSelection {
  label: string;
  latitude: number;
  longitude: number;
  raw: GooglePlacesDetails;
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
 */
const useGooglePlacesSearch = (query: string, delay: number = 300) => {
  const [results, setResults] = useState<GooglePlacesPrediction[]>([]);
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
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
            `input=${encodeURIComponent(query)}` +
            `&key=${GOOGLE_PLACES_API_KEY}` +
            `&components=country:gb`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        
        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          const predictions = data.predictions?.slice(0, 5) || [];
          console.log(`[PlaceAutocomplete] Found ${predictions.length} results for "${query}"`);
          setResults(predictions);
          setError(null);
        } else if (data.status === "INVALID_REQUEST") {
          setError("Invalid search");
          setResults([]);
        } else if (data.status === "REQUEST_DENIED") {
          setError("API key issue or service disabled");
          setResults([]);
        } else {
          setError("Failed to fetch suggestions");
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
  }, [query, delay]);

  return { results, isLoading, error };
};

/**
 * Extract text from prediction with fallbacks
 */
const getPredictionText = (prediction: GooglePlacesPrediction): { main: string; secondary: string } => {
  const main = prediction.main_text || prediction.description?.split(',')[0] || 'Unknown';
  const secondary = prediction.secondary_text || prediction.description?.split(',').slice(1).join(',').trim() || '';
  return { main, secondary };
};
const fetchPlaceDetails = async (placeId: string): Promise<GooglePlacesDetails | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}` +
        `&key=${GOOGLE_PLACES_API_KEY}` +
        `&fields=name,formatted_address,geometry`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch place details");
    }

    const data = await response.json();
    
    if (data.status === "OK" && data.result) {
      console.log('[PlaceAutocomplete] Place details fetched:', data.result.name);
      return data.result;
    } else {
      console.error("Place details error:", data.status);
      return null;
    }
  } catch (err) {
    console.error("Error fetching place details:", err);
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
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { results = [], isLoading, error } = useGooglePlacesSearch(searchText);

  const isDark = theme === "dark";

  // Sync searchText with initialValue changes
  useEffect(() => {
    setSearchText(initialValue);
  }, [initialValue]);

  // Animate suggestions appearance
  useEffect(() => {
    if (showSuggestions && results && results.length > 0) {
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
  }, [showSuggestions, results?.length]);

  // Show suggestions when we have results and input is focused
  // BUT keep them visible for a bit after blur to allow tap
  useEffect(() => {
    const resultsLength = results?.length || 0;
    if (resultsLength > 0 && isFocused) {
      setShowSuggestions(true);
      onSuggestionsVisibilityChange?.(true);
    } else if (!isFocused && resultsLength > 0) {
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
  }, [results?.length, isFocused, onSuggestionsVisibilityChange]);

  const handleTextChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleSuggestionPress = useCallback(
    async (prediction: GooglePlacesPrediction) => {
      const { main } = getPredictionText(prediction);
      console.log('[PlaceAutocomplete] Suggestion pressed:', main);
      setSearchText(main);
      setShowSuggestions(false);
      Keyboard.dismiss();

      // Fetch detailed location info using placeId
      setIsFetchingDetails(true);
      const details = await fetchPlaceDetails(prediction.place_id);
      setIsFetchingDetails(false);

      if (details) {
        // Call the parent's onSelect with structured data
        const selection = {
          label: details.name,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
          raw: details,
        };
        console.log('[PlaceAutocomplete] Calling onSelect with:', selection);
        onSelect(selection);
      } else {
        console.error('[PlaceAutocomplete] Failed to fetch place details');
      }
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
        {isLoading || isFetchingDetails ? (
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
      {showSuggestions && results && results.length > 0 && (
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
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={() => {}}
          onResponderMove={() => {}}
          onResponderRelease={() => {}}
          onResponderTerminationRequest={() => false}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            scrollEnabled={true}
            bounces={true}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            {results.map((item, index) => {
              return (
                <TouchableOpacity
                  key={item.place_id}
                  style={[
                    styles.suggestionItem,
                    {
                      backgroundColor: colors.suggestionBg,
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < (results?.length || 0) - 1 ? 0.5 : 0,
                    },
                  ]}
                  onPress={() => {
                    const { main } = getPredictionText(item);
                    console.log('[PlaceAutocomplete] TouchableOpacity pressed for:', main);
                    handleSuggestionPress(item);
                  }}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${getPredictionText(item).main}`}
                >
                  <View style={styles.iconContainer} pointerEvents="none">
                    <Ionicons
                      name="location"
                      size={20}
                      color="#007AFF"
                    />
                  </View>
                  
                  <View style={styles.textContainer} pointerEvents="none">
                    <Text
                      style={[styles.mainText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {getPredictionText(item).main}
                    </Text>
                    <Text
                      style={[styles.secondaryText, { color: colors.secondaryText }]}
                      numberOfLines={1}
                    >
                      {getPredictionText(item).secondary}
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
    zIndex: 9999,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 0,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: "500",
    marginBottom: 3,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: "400",
  },
});


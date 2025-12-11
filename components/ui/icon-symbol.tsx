// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import {
  OpaqueColorValue,
  Platform,
  type StyleProp,
  type TextStyle,
} from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "heart.fill": "favorite",
  "location.fill": "location-on",
  "gearshape.fill": "settings",

  // Adhkar time icons
  "sunrise.fill": "wb-sunny",
  "sunset.fill": "wb-twilight",
  "moon.stars.fill": "nightlight",
  "moon.fill": "nightlight",

  // Dua category icons
  airplane: "flight",
  "cloud.rain.fill": "cloud",

  // Detail screen icons
  textformat: "text-fields",
  "textformat.size": "format-size",
  "list.bullet.rectangle": "view-list",
  "chevron.left": "chevron-left",
  "heart.slash.fill": "heart-broken",
  ellipsis: "more-horiz",
  xmark: "close",
  "star.fill": "star",
  "book.fill": "menu-book",
  "arrow.right": "arrow-forward",

  // Level icons
  "leaf.fill": "eco",
  "flame.fill": "local-fire-department",

  // Other icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "info.circle": "info",
  "square.and.arrow.up": "share",
  heart: "favorite-border",
  "checkmark.circle.fill": "check-circle",
  "paintbrush.fill": "palette",
  "sun.max.fill": "wb-sunny",
  sparkles: "auto-awesome",
  link: "link",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  // Use native SF Symbols on iOS
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={name}
        size={size}
        tintColor={color}
        weight={weight}
        style={style}
      />
    );
  }

  // Use Material Icons on Android and web
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}

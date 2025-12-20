import { SymbolView, SymbolViewProps } from "expo-symbols";
import { Platform, StyleProp, ViewStyle } from "react-native";

interface IconProps {
  sf: {
    default: SymbolViewProps["name"];
    selected?: SymbolViewProps["name"];
  };
  selected?: boolean;
  focused?: boolean;
  color?: string;
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function Icon({
  sf,
  selected,
  focused,
  color,
  tintColor,
  style,
}: IconProps) {
  if (Platform.OS !== "ios") return null;

  // When using NativeTabs, sf can be passed as an object with default/selected
  // and the native tab bar handles the state automatically
  const isSelected = selected ?? focused ?? false;
  const iconColor = color ?? tintColor;

  // If sf has both default and selected, and we're in native tabs,
  // return a SymbolView that handles both states
  if (sf.selected && sf.default) {
    return (
      <SymbolView
        name={isSelected ? sf.selected : sf.default}
        tintColor={iconColor}
        style={[{ width: 24, height: 24 }, style]}
      />
    );
  }

  return (
    <SymbolView
      name={sf.default}
      tintColor={iconColor}
      style={[{ width: 24, height: 24 }, style]}
    />
  );
}

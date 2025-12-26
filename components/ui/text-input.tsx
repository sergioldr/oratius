import { Input, type InputProps } from "tamagui";

interface TextInputProps extends InputProps {
  /** Input height, defaults to 56 */
  inputHeight?: number;
  /** Show error state with red border */
  error?: boolean;
}

/**
 * Custom TextInput component with consistent styling
 * Uses the same background and border tokens as SecondaryButton
 */
export function TextInput({
  inputHeight = 44,
  error = false,
  ...props
}: TextInputProps) {
  return (
    <Input
      size="$1"
      height={inputHeight}
      paddingHorizontal="$4"
      backgroundColor="$buttonBackground"
      borderColor={error ? "$red9" : "$buttonBorderColor"}
      borderWidth={error ? 2 : 1}
      borderRadius="$4"
      color="$color"
      fontSize="$2"
      fontWeight="500"
      placeholderTextColor="$gray5"
      pressStyle={{
        backgroundColor: "$buttonBackgroundPress",
        borderColor: error ? "$red9" : "$buttonBorderColor",
      }}
      focusStyle={{
        backgroundColor: "$buttonBackground",
        borderColor: error ? "$red9" : "$buttonBorderColor",
        borderWidth: 2,
      }}
      hoverStyle={{
        backgroundColor: "$buttonBackgroundHover",
        borderColor: error ? "$red9" : "$borderColorHover",
      }}
      {...props}
    />
  );
}

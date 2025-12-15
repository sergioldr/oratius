import { Input, type InputProps } from "tamagui";

interface TextInputProps extends InputProps {
  /** Input height, defaults to 56 */
  inputHeight?: number;
}

/**
 * Custom TextInput component with consistent styling
 * Uses the same background and border tokens as SecondaryButton
 */
export function TextInput({ inputHeight = 56, ...props }: TextInputProps) {
  return (
    <Input
      size="$5"
      height={inputHeight}
      paddingHorizontal={24}
      backgroundColor="$buttonBackground"
      borderColor="$buttonBorderColor"
      borderWidth={1}
      borderRadius={9999}
      fontSize={16}
      placeholderTextColor="$gray5"
      focusStyle={{
        backgroundColor: "$buttonBackground",
        borderColor: "$buttonBorderColor",
        borderWidth: 2,
      }}
      hoverStyle={{
        backgroundColor: "$buttonBackgroundHover",
        borderColor: "$borderColorHover",
      }}
      {...props}
    />
  );
}

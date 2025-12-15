import { Sheet, Text, YStack } from "tamagui";
import { SecondaryButton } from "./secondary-button";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: number[];
}

export function Select<T extends string>({
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  open,
  onOpenChange,
  snapPoints = [50],
}: SelectProps<T>) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      <SecondaryButton
        height={44}
        paddingHorizontal="$4"
        icon="keyboard-arrow-down"
        iconPosition="right"
        onPress={() => onOpenChange(true)}
      >
        {selectedOption?.label || placeholder}
      </SecondaryButton>

      <Sheet
        modal
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4" backgroundColor="$background">
          <Sheet.Handle />
          <YStack gap="$2" marginTop="$4">
            {options.map((option) => (
              <SecondaryButton
                key={option.value}
                height={48}
                backgroundColor={
                  value === option.value ? "$primary6" : "transparent"
                }
                borderWidth={0}
                justifyContent="flex-start"
                onPress={() => {
                  onValueChange(option.value);
                  onOpenChange(false);
                }}
              >
                <Text
                  fontSize="$3"
                  fontWeight="500"
                  color={value === option.value ? "white" : "$color"}
                >
                  {option.label}
                </Text>
              </SecondaryButton>
            ))}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}

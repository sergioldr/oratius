import { Text, XStack, YStack, type YStackProps } from "tamagui";

interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string>
  extends Omit<YStackProps, "children"> {
  /**
   * Array of options to display
   */
  options: RadioOption<T>[];
  /**
   * Currently selected value
   */
  value: T;
  /**
   * Callback when selection changes
   */
  onValueChange: (value: T) => void;
}

/**
 * RadioGroup component for single-selection lists
 */
export function RadioGroup<T extends string>({
  options,
  value,
  onValueChange,
  ...props
}: RadioGroupProps<T>) {
  return (
    <YStack gap="$2" {...props}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <RadioItem
            key={option.value}
            label={option.label}
            selected={isSelected}
            onPress={() => onValueChange(option.value)}
          />
        );
      })}
    </YStack>
  );
}

interface RadioItemProps {
  /**
   * Label text for the radio item
   */
  label: string;
  /**
   * Whether this item is selected
   */
  selected: boolean;
  /**
   * Callback when pressed
   */
  onPress: () => void;
}

/**
 * Individual radio item component
 */
export function RadioItem({ label, selected, onPress }: RadioItemProps) {
  return (
    <XStack
      alignItems="center"
      gap="$3"
      paddingVertical="$3.5"
      paddingHorizontal="$3"
      borderRadius="$6"
      backgroundColor="$card"
      borderWidth={1}
      borderColor="$cardBorder"
      pressStyle={{
        scale: 0.98,
        opacity: 0.9,
      }}
      animation="quick"
      cursor="pointer"
      onPress={onPress}
    >
      {/* Radio Circle */}
      <YStack
        width={20}
        height={20}
        borderRadius={10}
        borderWidth={selected ? 2 : 1}
        borderColor={selected ? "$primary6" : "$cardBorder"}
        backgroundColor="transparent"
        alignItems="center"
        justifyContent="center"
      >
        {selected && (
          <YStack
            width={10}
            height={10}
            borderRadius={5}
            backgroundColor="$primary6"
          />
        )}
      </YStack>

      {/* Label */}
      <Text fontSize="$3" fontWeight="500" color="$color" flex={1}>
        {label}
      </Text>
    </XStack>
  );
}

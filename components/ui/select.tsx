import { Button, Sheet, styled, View } from "tamagui";
import { SecondaryButton } from "./secondary-button";

const SelectOptionButton = styled(Button, {
  height: 48,
  borderWidth: 0,
  justifyContent: "flex-start",
  borderRadius: "$4",
  paddingHorizontal: "$4",

  variants: {
    selected: {
      true: {
        backgroundColor: "$primary6",
        color: "white",
        pressStyle: {
          backgroundColor: "$primary6",
        },
        hoverStyle: {
          backgroundColor: "$primary6",
        },
      },
      false: {
        backgroundColor: "transparent",
        color: "$color",
        pressStyle: {
          backgroundColor: "transparent",
        },
        hoverStyle: {
          backgroundColor: "transparent",
        },
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const SheetHandle = styled(View, {
  width: 40,
  height: 4,
  backgroundColor: "$gray8",
  borderRadius: 2,
  alignSelf: "center",
  marginTop: 12,
  marginBottom: 8,
});

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
  error?: boolean;
}

export function Select<T extends string>({
  value,
  options,
  onValueChange,
  placeholder = "Select an option",
  open,
  onOpenChange,
  snapPoints = [50],
  error = false,
}: SelectProps<T>) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      <SecondaryButton
        height={44}
        paddingHorizontal="$4"
        icon="chevron-down"
        iconPosition="right"
        onPress={() => onOpenChange(true)}
        borderColor={error ? "$red9" : undefined}
        borderWidth={error ? 2 : undefined}
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
        <Sheet.Frame padding="$4" backgroundColor="$sheetBackground">
          <SheetHandle />
          <Sheet.ScrollView
            contentContainerStyle={{
              gap: 8,
              paddingTop: 12,
              paddingBottom: 24,
            }}
          >
            {options.map((option) => (
              <SelectOptionButton
                key={option.value}
                selected={value === option.value}
                onPress={() => {
                  onValueChange(option.value);
                  onOpenChange(false);
                }}
              >
                {option.label}
              </SelectOptionButton>
            ))}
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}

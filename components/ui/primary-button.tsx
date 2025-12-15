import { Button, type ButtonProps } from "tamagui";

interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function PrimaryButton({
  children,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      backgroundColor={disabled ? "$gray8" : "$primary6"}
      color="white"
      size="$5"
      borderRadius="$10"
      pressStyle={{
        opacity: 0.9,
        backgroundColor: "$primary6",
        borderColor: "$primary6",
      }}
      disabled={disabled}
      opacity={disabled ? 0.6 : 1}
      shadowColor="$primary6"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.25}
      shadowRadius={8}
      elevation={4}
      {...props}
    >
      {children}
    </Button>
  );
}

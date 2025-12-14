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
      color="$white1"
      size="$5"
      borderRadius="$4"
      pressStyle={{ opacity: 0.8 }}
      disabled={disabled}
      opacity={disabled ? 0.6 : 1}
      {...props}
    >
      {children}
    </Button>
  );
}

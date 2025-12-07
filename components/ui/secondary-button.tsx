import { Button, type ButtonProps } from "tamagui";

interface SecondaryButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export function SecondaryButton({ children, ...props }: SecondaryButtonProps) {
  return (
    <Button
      backgroundColor="transparent"
      color="$blue10"
      size="$4"
      pressStyle={{ opacity: 0.7 }}
      {...props}
    >
      {children}
    </Button>
  );
}

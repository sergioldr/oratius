import { YStack, styled, type GetProps, type YStackProps } from "tamagui";

const StyledCard = styled(YStack, {
  name: "Card",
  backgroundColor: "$card",
  borderRadius: "$6",
  borderWidth: 1,
  borderColor: "$cardBorder",

  variants: {
    variant: {
      default: {
        backgroundColor: "$card",
        borderColor: "$cardBorder",
      },
      elevated: {
        backgroundColor: "$card",
        borderColor: "$cardBorder",
        shadowColor: "$shadowColor",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      outlined: {
        backgroundColor: "transparent",
        borderColor: "$cardBorder",
        borderWidth: 1,
      },
      filled: {
        backgroundColor: "$gray3",
        borderColor: "transparent",
        borderWidth: 0,
      },
      ghost: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        borderWidth: 0,
      },
    },

    size: {
      sm: {
        padding: "$2",
        borderRadius: "$4",
      },
      md: {
        padding: "$4",
        borderRadius: "$6",
      },
      lg: {
        padding: "$5",
        borderRadius: "$8",
      },
    },

    interactive: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.9,
        },
        animation: "quick",
        cursor: "pointer",
      },
    },

    selected: {
      true: {
        backgroundColor: "$primary2",
        borderColor: "$primary6",
        borderWidth: 2,
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

type StyledCardProps = GetProps<typeof StyledCard>;

export interface CardProps extends YStackProps {
  /**
   * Visual style variant of the card
   * @default "default"
   */
  variant?: StyledCardProps["variant"];
  /**
   * Size preset for padding and border radius
   * @default "md"
   */
  size?: StyledCardProps["size"];
  /**
   * Whether the card has press interaction styles
   * @default false
   */
  interactive?: boolean;
  /**
   * Whether the card is in a selected state
   * @default false
   */
  selected?: boolean;
  /**
   * Whether the card is disabled
   * @default false
   */
  disabled?: boolean;
}

export function Card({
  variant = "default",
  size = "md",
  interactive = false,
  selected = false,
  disabled = false,
  children,
  ...props
}: CardProps) {
  return (
    <StyledCard
      variant={variant}
      size={size}
      interactive={interactive}
      selected={selected}
      disabled={disabled}
      {...props}
    >
      {children}
    </StyledCard>
  );
}

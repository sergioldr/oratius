import { styled, Text, XStack, type GetProps } from "tamagui";

const StyledTag = styled(XStack, {
  name: "Tag",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: "$2",
  paddingVertical: "$1",
  borderRadius: "$10",
  borderWidth: 1,
  borderColor: "$cardBorder",
  backgroundColor: "$buttonBackground",

  variants: {
    variant: {
      default: {
        backgroundColor: "$buttonBackground",
        borderColor: "$cardBorder",
      },
      primary: {
        backgroundColor: "$blue3",
        borderColor: "$blue6",
      },
      success: {
        backgroundColor: "$green3",
        borderColor: "$green6",
      },
      warning: {
        backgroundColor: "$yellow3",
        borderColor: "$yellow6",
      },
      error: {
        backgroundColor: "$red3",
        borderColor: "$red6",
      },
      ghost: {
        backgroundColor: "transparent",
        borderColor: "$cardBorder",
      },
    },

    size: {
      sm: {
        paddingHorizontal: "$1.5",
        paddingVertical: "$0.5",
      },
      md: {
        paddingHorizontal: "$2",
        paddingVertical: "$1",
      },
      lg: {
        paddingHorizontal: "$3",
        paddingVertical: "$1.5",
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

const StyledTagText = styled(Text, {
  name: "TagText",
  fontSize: "$2",
  fontWeight: "600",
  color: "$gray11",

  variants: {
    variant: {
      default: {
        color: "$gray11",
      },
      primary: {
        color: "$blue10",
      },
      success: {
        color: "$green10",
      },
      warning: {
        color: "$yellow10",
      },
      error: {
        color: "$red10",
      },
      ghost: {
        color: "$gray11",
      },
    },

    size: {
      sm: {
        fontSize: "$1",
      },
      md: {
        fontSize: "$2",
      },
      lg: {
        fontSize: "$3",
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

type StyledTagProps = GetProps<typeof StyledTag>;

export interface TagProps extends Omit<StyledTagProps, "children"> {
  /**
   * The text content of the tag
   */
  label: string;
  /**
   * Visual style variant of the tag
   * @default "default"
   */
  variant?: StyledTagProps["variant"];
  /**
   * Size preset for the tag
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Tag component for displaying labels, badges, or status indicators
 */
export function Tag({
  label,
  variant = "default",
  size = "md",
  ...props
}: TagProps) {
  return (
    <StyledTag variant={variant} size={size} {...props}>
      <StyledTagText variant={variant} size={size}>
        {label}
      </StyledTagText>
    </StyledTag>
  );
}

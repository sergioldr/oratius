import {
  DancingScript_700Bold,
  useFonts as useDancingScriptFonts,
} from "@expo-google-fonts/dancing-script";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SplashScreenProps {
  onReady?: () => void;
}

/**
 * Custom splash screen component with brand styling.
 * Shows the Dilo logo with animations while app initializes.
 */
export function SplashScreen({ onReady }: SplashScreenProps) {
  // Animation values
  const loadingBarPosition = useRef(new Animated.Value(0)).current;

  const [dancingScriptLoaded] = useDancingScriptFonts({
    DancingScript_700Bold,
  });

  // Start loading bar animation (slides from left to right, exits completely)
  const startLoadingAnimation = useCallback(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingBarPosition, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(loadingBarPosition, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return animation;
  }, [loadingBarPosition]);

  useEffect(() => {
    const loadingAnim = startLoadingAnimation();

    return () => {
      loadingAnim.stop();
    };
  }, [startLoadingAnimation]);

  // Notify when fonts are loaded
  useEffect(() => {
    if (dancingScriptLoaded) {
      onReady?.();
    }
  }, [dancingScriptLoaded, onReady]);

  // Interpolate translateX for loading bar (enter from left, exit to right)
  // Bar width is 64, container is 128, so we need to move from -64 to 128
  const loadingBarTranslateX = loadingBarPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-64, 128],
  });

  return (
    <View style={styles.container}>
      {/* Background with primary color */}
      <LinearGradient
        colors={["#2547f4", "#1e3ed4"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Background Elements */}
      {/* Top Right Glow */}
      <View style={styles.topRightGlow} />
      {/* Bottom Left Glow */}
      <View style={styles.bottomLeftGlow} />

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Logo Group */}
        <View style={styles.logoGroup}>
          {/* Handwriting Logo */}
          <Text
            style={[
              styles.logoText,
              dancingScriptLoaded && { fontFamily: "DancingScript_700Bold" },
            ]}
          >
            Dilo
          </Text>

          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Speak with confidence</Text>
            {/* Divider Line */}
            <View style={styles.divider} />
          </View>
        </View>
      </View>

      {/* Bottom UI Area */}
      <View style={styles.bottomArea}>
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          {/* Visual Loading Bar */}
          <View style={styles.loadingBarBackground}>
            <Animated.View
              style={[
                styles.loadingBarFill,
                { transform: [{ translateX: loadingBarTranslateX }] },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Loading experience...</Text>
        </View>

        {/* Footer Meta */}
        <View style={styles.footerMeta}>
          <View style={styles.poweredByContainer}>
            <Ionicons name="sparkles" size={18} color="white" />
            <Text style={styles.poweredByText}>POWERED BY AI</Text>
          </View>
          <Text style={styles.versionText}>v1.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  topRightGlow: {
    position: "absolute",
    top: -96,
    right: -96,
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomLeftGlow: {
    position: "absolute",
    bottom: -128,
    left: -128,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(99, 102, 241, 0.3)",
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 48,
    zIndex: 10,
  },
  logoGroup: {
    alignItems: "center",
  },
  logoText: {
    fontSize: SCREEN_WIDTH >= 640 ? 112 : 96,
    fontWeight: "700",
    color: "white",
    transform: [{ rotate: "-2deg" }],
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    // Fallback font before Dancing Script loads
    fontFamily: "System",
  },
  taglineContainer: {
    marginTop: 24,
    alignItems: "center",
    gap: 12,
  },
  taglineText: {
    color: "white",
    fontSize: SCREEN_WIDTH >= 640 ? 20 : 18,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 1,
  },
  bottomArea: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 24,
    zIndex: 20,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 48,
  },
  loadingBarBackground: {
    width: 128,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  loadingBarFill: {
    width: 64,
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  footerMeta: {
    marginTop: 16,
    alignItems: "center",
    gap: 4,
    opacity: 0.8,
  },
  poweredByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  poweredByText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  versionText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
    fontFamily: "monospace",
  },
});

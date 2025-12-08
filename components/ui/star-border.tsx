// StarBorder.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const AnimatedView = Animated.createAnimatedComponent(View);

type StarBorderProps = {
  color?: string;
  speed?: string | number; // '6s', '3000ms' o número en ms
  thickness?: number;
  style?: any;
  children?: React.ReactNode;
  onPress?: () => void;
};

const StarBorder: React.FC<StarBorderProps> = ({
  color = "#ffffff",
  speed = "6s",
  thickness = 1,
  style,
  children,
  onPress,
}) => {
  const [width, setWidth] = useState<number | null>(null);

  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const duration = getDuration(speed);

  // Arrancamos la animación SOLO una vez, cuando ya conocemos el ancho
  useEffect(() => {
    if (width == null) return; // aún no sabemos el ancho
    if (animationRef.current) return; // ya está corriendo

    progress.setValue(0);

    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true } // 1 -> 0 instantáneo, sin rebote
    );

    animationRef.current = anim;
    anim.start();

    return () => {
      anim.stop();
      animationRef.current = null;
    };
  }, [width, duration, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && width == null) {
      setWidth(w);
    }
  };

  // Mientras medimos el ancho, solo mostramos el botón interno
  if (width == null) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onLayout={onLayout}
        style={[styles.container, { paddingVertical: thickness }, style]}
      >
        <View style={styles.innerContent}>{children}</View>
      </TouchableOpacity>
    );
  }

  // Una vez tenemos width, calculamos tamaños y trayectorias
  const gradientWidth = width * 3; // como el 300% del CSS
  const gradientHeight = 18; // grosor de la banda de luz

  // Queremos que el glow recorra todo el botón + salga fuera:
  // bottom: empieza totalmente a la izquierda y termina totalmente a la derecha
  // top: empieza totalmente a la derecha y termina totalmente a la izquierda
  const bottomStartX = -gradientWidth;
  const bottomEndX = width;
  const topStartX = width;
  const topEndX = -gradientWidth;

  const bottomTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [bottomStartX, bottomEndX], // izquierda -> derecha
  });

  const topTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [topStartX, topEndX], // derecha -> izquierda
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLayout={onLayout}
      style={[styles.container, { paddingVertical: thickness }, style]}
    >
      {/* Glow inferior: se mueve de izquierda a derecha */}
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.glowBase,
          styles.glowBottom,
          {
            width: gradientWidth,
            height: gradientHeight,
            borderRadius: gradientHeight * 2,
            opacity: 0.7,
            transform: [{ translateX: bottomTranslateX }],
          },
        ]}
      >
        <LinearGradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          colors={["transparent", color, "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedView>

      {/* Glow superior: se mueve de derecha a izquierda */}
      <AnimatedView
        pointerEvents="none"
        style={[
          styles.glowBase,
          styles.glowTop,
          {
            width: gradientWidth,
            height: gradientHeight,
            borderRadius: gradientHeight * 2,
            opacity: 0.7,
            transform: [{ translateX: topTranslateX }],
          },
        ]}
      >
        <LinearGradient
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          colors={["transparent", color, "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </AnimatedView>

      {/* Contenido del botón (equivalente a .inner-content) */}
      <View style={styles.innerContent}>{children}</View>
    </TouchableOpacity>
  );
};

const getDuration = (speed: string | number): number => {
  if (typeof speed === "number") return speed;

  const s = `${speed}`.trim().toLowerCase();

  if (s.endsWith("ms")) {
    const v = parseFloat(s.replace("ms", ""));
    return isNaN(v) ? 6000 : v;
  }

  if (s.endsWith("s")) {
    const v = parseFloat(s.replace("s", ""));
    return isNaN(v) ? 6000 : v * 1000;
  }

  const v = parseFloat(s);
  return isNaN(v) ? 6000 : v * 1000;
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  glowBase: {
    position: "absolute",
    zIndex: 0,
  },
  glowBottom: {
    bottom: -8,
  },
  glowTop: {
    top: -8,
  },
  innerContent: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#000",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});

export default StarBorder;

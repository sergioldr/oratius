import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

// SKSL shader - translated from GLSL
const skslShader = Skia.RuntimeEffect.Make(`
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uSpeed;

vec4 main(vec2 fragCoord) {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (fragCoord.xy / uResolution.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (vec2(0.5) - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    a += cos(fi - d - a * uv.x);
    d += sin(uv.y * fi + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  
  return vec4(col, 1.0);
}
`)!;

type IridescenceProps = {
  color?: number[];
  speed?: number;
  amplitude?: number;
};

export function Iridescence({
  color = [0.3, 0.6, 1],
  speed = 0.1,
  amplitude = 0.1,
}: IridescenceProps) {
  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 256, height: 256 });

  // Shared values for uniforms
  const time = useSharedValue(0);
  const targetColor = useSharedValue(color);
  const currentColor = useSharedValue({
    r: color[0],
    g: color[1],
    b: color[2],
  });
  const speedValue = useSharedValue(speed);
  const amplitudeValue = useSharedValue(amplitude);

  // Update values when props change
  useEffect(() => {
    targetColor.value = color;
    speedValue.value = speed;
    amplitudeValue.value = amplitude;
  }, [color, speed, amplitude, targetColor, speedValue, amplitudeValue]);

  // Smooth color transition
  useDerivedValue(() => {
    const factor = 0.05;
    const target = targetColor.value;
    const current = currentColor.value;

    currentColor.value = {
      r: current.r + (target[0] - current.r) * factor,
      g: current.g + (target[1] - current.g) * factor,
      b: current.b + (target[2] - current.b) * factor,
    };
  });

  // Animation loop for time
  useFrameCallback((frameInfo) => {
    const dt = frameInfo.timeSincePreviousFrame || 0;
    time.value += dt * 0.001; // Convert ms to seconds

    // Optional: period wrapping
    const currentSpeed = speedValue.value;
    if (Math.abs(currentSpeed) > 0.0001) {
      const period = (4 * Math.PI) / Math.abs(currentSpeed);
      if (time.value > period) {
        time.value = time.value % period;
      }
    }
  });

  // Handle layout changes
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  };

  // Create uniforms object
  const uniforms = useDerivedValue(() => {
    const current = currentColor.value;
    return {
      uResolution: [dimensions.width, dimensions.height],
      uTime: time.value,
      uColor: [current.r, current.g, current.b],
      uAmplitude: amplitudeValue.value,
      uSpeed: speedValue.value,
    };
  }, [dimensions]);

  if (!skslShader) {
    // Fallback if shader compilation failed
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: `rgb(${color[0] * 255}, ${color[1] * 255}, ${
              color[2] * 255
            })`,
          },
        ]}
      />
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Canvas style={styles.canvas}>
        <Fill>
          <Shader source={skslShader} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});

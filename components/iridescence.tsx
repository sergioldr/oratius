import type { ExpoWebGLRenderingContext } from "expo-gl";
import { GLView } from "expo-gl";
import React, { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus, StyleSheet, View } from "react-native";

const vertexShaderSource = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (vec2(0.5) - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

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
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const uniformLocationsRef = useRef<{
    uTime?: WebGLUniformLocation | null;
    uColor?: WebGLUniformLocation | null;
    uResolution?: WebGLUniformLocation | null;
    uAmplitude?: WebGLUniformLocation | null;
    uSpeed?: WebGLUniformLocation | null;
  }>({});

  const lastTimeRef = useRef<number | undefined>(undefined);
  const currentTimeRef = useRef(0);

  const targetColorRef = useRef<number[]>(color);
  const currentColorRef = useRef<{ r: number; g: number; b: number }>({
    r: color[0],
    g: color[1],
    b: color[2],
  });

  const amplitudeRef = useRef(amplitude);
  const speedRef = useRef(speed);

  // Track if animation is running and app state
  const isAnimatingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const renderRef = useRef<((t: number) => void) | null>(null);

  // Keep refs in sync with props
  useEffect(() => {
    targetColorRef.current = color;
    amplitudeRef.current = amplitude;
    speedRef.current = speed;
  }, [color, amplitude, speed]);

  const compileShader = (
    gl: ExpoWebGLRenderingContext,
    type: number,
    source: string
  ) => {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Could not compile shader:\n${info}`);
    }

    return shader;
  };

  const createProgram = (
    gl: ExpoWebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
  ) => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentSource
    );

    const program = gl.createProgram();
    if (!program) {
      throw new Error("Failed to create program");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Could not link program:\n${info}`);
    }

    // Shaders can be deleted after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  };

  const onContextCreate = useCallback(async (gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    programRef.current = program;

    gl.useProgram(program);

    // Full-screen quad (two triangles) with interleaved position (x,y) and uv (u,v)
    const vertices = new Float32Array([
      // x,   y,   u, v
      -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1,
      1,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    const uvLocation = gl.getAttribLocation(program, "uv");

    const stride = 4 * 4; // 4 floats per vertex * 4 bytes per float
    const positionOffset = 0;
    const uvOffset = 2 * 4; // after 2 floats (x,y)

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      stride,
      positionOffset
    );

    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, stride, uvOffset);

    // Uniform locations
    const uTime = gl.getUniformLocation(program, "uTime");
    const uColor = gl.getUniformLocation(program, "uColor");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uAmplitude = gl.getUniformLocation(program, "uAmplitude");
    const uSpeed = gl.getUniformLocation(program, "uSpeed");

    uniformLocationsRef.current = {
      uTime,
      uColor,
      uResolution,
      uAmplitude,
      uSpeed,
    };

    // Initial uniform values
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    gl.viewport(0, 0, width, height);

    if (uResolution) {
      gl.uniform3f(uResolution, width, height, width / height);
    }
    if (uAmplitude) {
      gl.uniform1f(uAmplitude, amplitudeRef.current);
    }
    if (uSpeed) {
      gl.uniform1f(uSpeed, speedRef.current);
    }
    if (uColor) {
      const { r, g, b } = currentColorRef.current;
      gl.uniform3f(uColor, r, g, b);
    }

    gl.clearColor(0, 0, 0, 0);

    // Animation loop
    const render = (t: number) => {
      // Stop rendering if app is in background
      if (!glRef.current || !programRef.current || !isAnimatingRef.current) {
        return;
      }
      const gl = glRef.current;
      gl.useProgram(programRef.current);

      // Time step
      if (lastTimeRef.current === undefined) {
        lastTimeRef.current = t;
      }
      const dt = (t - lastTimeRef.current) * 0.001; // ms -> s
      lastTimeRef.current = t;

      currentTimeRef.current += dt;

      // Optional: period wrapping like the original
      const speed = speedRef.current;
      if (Math.abs(speed) > 0.0001) {
        const period = (4 * Math.PI) / Math.abs(speed);
        if (currentTimeRef.current > period) {
          currentTimeRef.current %= period;
        }
      }

      const { uTime, uColor, uResolution, uAmplitude, uSpeed } =
        uniformLocationsRef.current;

      // Update resolution each frame (in case layout changed)
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      gl.viewport(0, 0, width, height);
      if (uResolution) {
        gl.uniform3f(uResolution, width, height, width / height);
      }

      // Smooth color transition
      const target = targetColorRef.current;
      const current = currentColorRef.current;
      const factor = 0.05;

      current.r += (target[0] - current.r) * factor;
      current.g += (target[1] - current.g) * factor;
      current.b += (target[2] - current.b) * factor;

      if (uColor) {
        gl.uniform3f(uColor, current.r, current.g, current.b);
      }

      if (uAmplitude) {
        gl.uniform1f(uAmplitude, amplitudeRef.current);
      }
      if (uSpeed) {
        gl.uniform1f(uSpeed, speedRef.current);
      }
      if (uTime) {
        gl.uniform1f(uTime, currentTimeRef.current);
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.flush();
      gl.endFrameEXP();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Store render function in ref for AppState handler
    renderRef.current = render;
    isAnimatingRef.current = true;
    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground - restart animation
        // Reset lastTimeRef to avoid large time jumps
        lastTimeRef.current = undefined;
        isAnimatingRef.current = true;
        if (renderRef.current && glRef.current) {
          animationFrameRef.current = requestAnimationFrame(renderRef.current);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background - stop animation
        isAnimatingRef.current = false;
        if (animationFrameRef.current != null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isAnimatingRef.current = false;
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const gl = glRef.current;
      if (gl) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glView: {
    flex: 1,
  },
});

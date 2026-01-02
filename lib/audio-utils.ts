/**
 * Audio utilities for consistent audio processing across the app.
 * Centralizes audio level normalization and conversion functions.
 */

/**
 * Audio level normalization configuration
 */
export interface AudioLevelConfig {
  /** Minimum dB threshold to consider as speech (default: -35) */
  noiseThreshold?: number;
  /** Maximum dB level for normalization (default: -5) */
  maxLevel?: number;
}

/** Default audio level configuration optimized for voice */
export const DEFAULT_AUDIO_LEVEL_CONFIG: Required<AudioLevelConfig> = {
  noiseThreshold: -35,
  maxLevel: -5,
};

/**
 * Normalize audio metering from decibels to a 0-1 range.
 * Values below noise threshold return 0, values at maxLevel return 1.
 *
 * @param meteringDb - Raw metering value in decibels
 * @param config - Optional configuration for thresholds
 * @returns Normalized level between 0 and 1
 */
export function normalizeMeteringDb(
  meteringDb: number,
  config?: AudioLevelConfig
): number {
  const { noiseThreshold, maxLevel } = {
    ...DEFAULT_AUDIO_LEVEL_CONFIG,
    ...config,
  };

  if (meteringDb < noiseThreshold) {
    return 0;
  }

  const range = maxLevel - noiseThreshold;
  return Math.max(0, Math.min(1, (meteringDb - noiseThreshold) / range));
}

/**
 * Calculate RMS (Root Mean Square) level from Float32 audio samples.
 * Used for real-time audio level visualization.
 *
 * @param samples - Float32Array of audio samples (-1 to 1)
 * @param amplification - Amplification factor for visualization (default: 3)
 * @returns Normalized level between 0 and 1
 */
export function calculateRmsLevel(
  samples: Float32Array,
  amplification = 3
): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sum / samples.length);
  return Math.min(1, rms * amplification);
}

/**
 * Convert Float32Array audio samples to Int16Array for WebSocket transmission.
 * Audio format: linear16 (16-bit signed integer PCM)
 *
 * @param float32Array - Float32Array of audio samples (-1 to 1)
 * @returns Int16Array suitable for transmission
 */
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return int16Array;
}

/**
 * Pre-calculated animation values based on audio level.
 * Used for visual feedback components like voice orbs.
 */
export interface AudioLevelAnimationValues {
  amplitude: number;
  speed: number;
  scale: number;
  glowOpacity: number;
}

/**
 * Calculate animation values from normalized audio level.
 * Provides consistent visual feedback parameters across the app.
 *
 * @param level - Normalized audio level (0 to 1)
 * @returns Animation values for visual components
 */
export function calculateAnimationValues(
  level: number
): AudioLevelAnimationValues {
  const clampedLevel = Math.min(Math.max(level, 0), 1);

  return {
    amplitude: 0.18 + clampedLevel * 1.7,
    speed: 0.75 + clampedLevel * 0.2,
    scale: 1 + clampedLevel * 0.12,
    glowOpacity: 0.25 + clampedLevel * 0.75,
  };
}

/**
 * Audio streaming configuration constants
 */
export const AUDIO_STREAM_CONFIG = {
  /** Default sample rate for voice (16kHz) */
  SAMPLE_RATE: 16000,
  /** Default polling interval for metering (50ms) */
  METERING_INTERVAL: 50,
  /** Buffer size for web audio processing (~256ms at 16kHz) */
  WEB_BUFFER_SIZE: 4096,
  /** Bit rate for encoded audio */
  BIT_RATE: 128000,
} as const;

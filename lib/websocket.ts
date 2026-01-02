import { logger } from "./logger";

/**
 * WebSocket message types from server
 */
export type ServerMessageType =
  | "ready"
  | "error"
  | "pong"
  | "conversation_text"
  | "user_speaking"
  | "agent_audio_done";

/**
 * Base server message structure
 */
interface BaseServerMessage {
  type: ServerMessageType;
  timestamp: string;
}

/**
 * Ready message - sent when WebSocket is ready for streaming
 */
export interface ReadyMessage extends BaseServerMessage {
  type: "ready";
  message: string;
}

/**
 * Error message from server
 */
export interface ErrorMessage extends BaseServerMessage {
  type: "error";
  message: string;
}

/**
 * Pong message - response to ping
 */
export interface PongMessage extends BaseServerMessage {
  type: "pong";
}

/**
 * Conversation text message - transcribed speech or AI response
 */
export interface ConversationTextMessage extends BaseServerMessage {
  type: "conversation_text";
  role: "user" | "assistant";
  content: string;
}

/**
 * User speaking indicator
 */
export interface UserSpeakingMessage extends BaseServerMessage {
  type: "user_speaking";
}

/**
 * Agent finished playing audio
 */
export interface AgentAudioDoneMessage extends BaseServerMessage {
  type: "agent_audio_done";
}

/**
 * Union type for all server messages
 */
export type ServerMessage =
  | ReadyMessage
  | ErrorMessage
  | PongMessage
  | ConversationTextMessage
  | UserSpeakingMessage
  | AgentAudioDoneMessage;

/**
 * Client message types
 */
export type ClientMessageType = "ping" | "close";

/**
 * Client control messages
 */
export interface PingMessage {
  type: "ping";
}

export interface CloseMessage {
  type: "close";
}

export type ClientMessage = PingMessage | CloseMessage;

/**
 * Interview session start request body
 */
export interface StartInterviewRequest {
  candidate_name: string;
  job_role: string;
  sector: string;
  seniority: string;
  language?: string;
}

/**
 * Interview session start response
 */
export interface StartInterviewResponse {
  sessionId: string;
  audioWebSocketUrl: string;
  eventsUrl: string;
  status: string;
}

/**
 * Interview session details
 */
export interface InterviewSession {
  id: string;
  status: "created" | "connected" | "in_progress" | "ended" | "failed";
  candidate_name: string;
  job_role: string;
  sector: string;
  seniority: string;
  instructions: string | null;
  agent_id: string | null;
  connection_url: string | null;
  attached_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * End interview response
 */
export interface EndInterviewResponse {
  sessionId: string;
  status: string;
  ended_at: string;
  message: string;
}

/**
 * WebSocket close codes
 */
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  INTERNAL_ERROR: 1011,
} as const;

/**
 * Parse incoming WebSocket message
 */
export function parseServerMessage(data: string): ServerMessage | null {
  try {
    return JSON.parse(data) as ServerMessage;
  } catch {
    logger.error("WebSocket", "Failed to parse message", { data });
    return null;
  }
}

/**
 * Create a ping message
 */
export function createPingMessage(): string {
  return JSON.stringify({ type: "ping" });
}

/**
 * Create a close message
 */
export function createCloseMessage(): string {
  return JSON.stringify({ type: "close" });
}

/**
 * Reconnection configuration
 */
export interface ReconnectionConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Default reconnection config with exponential backoff
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  maxAttempts: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

/**
 * Calculate delay for reconnection attempt with exponential backoff
 */
export function calculateReconnectionDelay(
  attempt: number,
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(2, attempt),
    config.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

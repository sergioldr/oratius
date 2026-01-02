import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import type {
  ConversationTextMessage,
  InterviewSession,
  ServerMessage,
} from "@/lib/websocket";

/**
 * WebSocket connection status
 */
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "ready"
  | "error"
  | "reconnecting";

/**
 * AI agent status during interview
 */
export type AgentStatus = "idle" | "listening" | "thinking" | "speaking";

/**
 * Conversation message in history
 */
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Interview store state
 */
interface InterviewState {
  // Session info
  sessionId: string | null;
  session: InterviewSession | null;
  audioWebSocketUrl: string | null;

  // Connection state
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  lastError: string | null;

  // Conversation state
  conversationHistory: ConversationMessage[];
  currentQuestion: string | null;
  questionCount: number;

  // Audio/Agent state
  agentStatus: AgentStatus;
  isUserSpeaking: boolean;
  audioLevel: number;

  // Timer
  elapsedSeconds: number;
}

/**
 * Interview store actions
 */
interface InterviewActions {
  // Session management
  setSession: (
    sessionId: string,
    audioWebSocketUrl: string,
    session?: InterviewSession
  ) => void;
  clearSession: () => void;

  // Connection management
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setError: (error: string | null) => void;

  // Conversation management
  addMessage: (message: ConversationMessage) => void;
  setCurrentQuestion: (question: string | null) => void;
  handleServerMessage: (message: ServerMessage) => void;

  // Audio/Agent state
  setAgentStatus: (status: AgentStatus) => void;
  setUserSpeaking: (speaking: boolean) => void;
  setAudioLevel: (level: number) => void;

  // Timer
  setElapsedSeconds: (seconds: number) => void;
  incrementElapsedSeconds: () => void;

  // Reset
  reset: () => void;
}

/**
 * Combined interview store type
 */
type InterviewStore = InterviewState & InterviewActions;

/**
 * Initial/default state
 */
const initialState: InterviewState = {
  sessionId: null,
  session: null,
  audioWebSocketUrl: null,
  connectionStatus: "disconnected",
  reconnectAttempts: 0,
  lastError: null,
  conversationHistory: [],
  currentQuestion: null,
  questionCount: 0,
  agentStatus: "idle",
  isUserSpeaking: false,
  audioLevel: 0,
  elapsedSeconds: 0,
};

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Zustand store for managing interview WebSocket state
 */
export const useInterviewStore = create<InterviewStore>((set, get) => ({
  ...initialState,

  // Session management
  setSession: (sessionId, audioWebSocketUrl, session) =>
    set({
      sessionId,
      audioWebSocketUrl,
      session: session ?? null,
    }),

  clearSession: () =>
    set({
      sessionId: null,
      audioWebSocketUrl: null,
      session: null,
    }),

  // Connection management
  setConnectionStatus: (status) =>
    set({
      connectionStatus: status,
      // Clear error when successfully connected
      lastError: status === "ready" ? null : get().lastError,
    }),

  incrementReconnectAttempts: () =>
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    })),

  resetReconnectAttempts: () =>
    set({
      reconnectAttempts: 0,
    }),

  setError: (error) =>
    set({
      lastError: error,
      connectionStatus: error ? "error" : get().connectionStatus,
    }),

  // Conversation management
  addMessage: (message) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, message],
      // Update question count when assistant speaks
      questionCount:
        message.role === "assistant"
          ? state.questionCount + 1
          : state.questionCount,
    })),

  setCurrentQuestion: (question) =>
    set({
      currentQuestion: question,
    }),

  handleServerMessage: (message) => {
    switch (message.type) {
      case "ready":
        set({
          connectionStatus: "ready",
          lastError: null,
          agentStatus: "listening",
        });
        break;

      case "error":
        set({
          lastError: message.message,
          connectionStatus: "error",
        });
        break;

      case "conversation_text": {
        const textMessage = message as ConversationTextMessage;
        const newMessage: ConversationMessage = {
          id: generateMessageId(),
          role: textMessage.role,
          content: textMessage.content,
          timestamp: textMessage.timestamp,
        };

        set((s) => ({
          conversationHistory: [...s.conversationHistory, newMessage],
          // If assistant is speaking, update current question
          currentQuestion:
            textMessage.role === "assistant"
              ? textMessage.content
              : s.currentQuestion,
          // Update question count when assistant speaks
          questionCount:
            textMessage.role === "assistant"
              ? s.questionCount + 1
              : s.questionCount,
          // Update agent status based on role
          agentStatus:
            textMessage.role === "assistant" ? "speaking" : "listening",
        }));
        break;
      }

      case "user_speaking":
        set({
          isUserSpeaking: true,
          agentStatus: "listening",
        });
        break;

      case "agent_audio_done":
        set({
          agentStatus: "listening",
          isUserSpeaking: false,
        });
        break;

      case "pong":
        // Heartbeat response, no state change needed
        break;
    }
  },

  // Audio/Agent state
  setAgentStatus: (status) =>
    set({
      agentStatus: status,
    }),

  setUserSpeaking: (speaking) =>
    set({
      isUserSpeaking: speaking,
    }),

  setAudioLevel: (level) =>
    set({
      audioLevel: Math.max(0, Math.min(1, level)),
    }),

  // Timer
  setElapsedSeconds: (seconds) =>
    set({
      elapsedSeconds: seconds,
    }),

  incrementElapsedSeconds: () =>
    set((state) => ({
      elapsedSeconds: state.elapsedSeconds + 1,
    })),

  // Reset
  reset: () => set(initialState),
}));

/**
 * Selector hooks for specific state slices
 */
export const useInterviewConnection = () =>
  useInterviewStore(
    useShallow((state) => ({
      connectionStatus: state.connectionStatus,
      reconnectAttempts: state.reconnectAttempts,
      lastError: state.lastError,
    }))
  );

export const useInterviewConversation = () =>
  useInterviewStore(
    useShallow((state) => ({
      conversationHistory: state.conversationHistory,
      currentQuestion: state.currentQuestion,
      questionCount: state.questionCount,
    }))
  );

export const useInterviewAgentStatus = () =>
  useInterviewStore(
    useShallow((state) => ({
      agentStatus: state.agentStatus,
      isUserSpeaking: state.isUserSpeaking,
      audioLevel: state.audioLevel,
    }))
  );

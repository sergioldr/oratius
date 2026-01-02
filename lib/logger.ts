/**
 * Custom Logger for Voice Interview Flow
 *
 * Provides structured logging with debug mode controlled by environment variable.
 * Enable debug mode by setting EXPO_PUBLIC_DEBUG_MODE=true in your .env file.
 */

const IS_DEBUG_MODE =
  process.env.EXPO_PUBLIC_DEBUG_MODE === "true" ||
  process.env.EXPO_PUBLIC_DEBUG_MODE === "1";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDebugEnabled: boolean;

  constructor() {
    this.isDebugEnabled = IS_DEBUG_MODE;
  }

  /**
   * Format timestamp for logs
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format log message with context
   */
  private formatMessage(
    level: LogLevel,
    scope: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = this.getTimestamp();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] [${scope}] ${message}${contextStr}`;
  }

  /**
   * Log debug message (only in debug mode)
   */
  debug(scope: string, message: string, context?: LogContext): void {
    if (!this.isDebugEnabled) return;
    console.log(this.formatMessage(LogLevel.DEBUG, scope, message, context));
  }

  /**
   * Log info message
   */
  info(scope: string, message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, scope, message, context));
  }

  /**
   * Log warning message
   */
  warn(scope: string, message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, scope, message, context));
  }

  /**
   * Log error message
   */
  error(scope: string, message: string, context?: LogContext): void {
    console.error(this.formatMessage(LogLevel.ERROR, scope, message, context));
  }

  /**
   * Log API request
   */
  apiRequest(
    scope: string,
    endpoint: string,
    method: string,
    body?: unknown
  ): void {
    this.debug(scope, `API Request: ${method} ${endpoint}`, {
      method,
      endpoint,
      body,
    });
  }

  /**
   * Log API response
   */
  apiResponse(
    scope: string,
    endpoint: string,
    status: number,
    data?: unknown,
    error?: string
  ): void {
    if (error) {
      this.error(scope, `API Error: ${endpoint}`, {
        endpoint,
        status,
        error,
      });
    } else {
      this.debug(scope, `API Response: ${endpoint}`, {
        endpoint,
        status,
        data,
      });
    }
  }

  /**
   * Log WebSocket event
   */
  wsEvent(scope: string, event: string, details?: LogContext): void {
    this.debug(scope, `WebSocket Event: ${event}`, details);
  }

  /**
   * Log state transition
   */
  stateTransition(
    scope: string,
    fromState: string,
    toState: string,
    reason?: string
  ): void {
    this.debug(scope, `State Transition: ${fromState} -> ${toState}`, {
      from: fromState,
      to: toState,
      reason,
    });
  }

  /**
   * Enable/disable debug mode at runtime
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugEnabled = enabled;
    this.info("Logger", `Debug mode ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Check if debug mode is enabled
   */
  isDebug(): boolean {
    return this.isDebugEnabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases
export const logDebug = (
  scope: string,
  message: string,
  context?: LogContext
) => logger.debug(scope, message, context);

export const logInfo = (scope: string, message: string, context?: LogContext) =>
  logger.info(scope, message, context);

export const logWarn = (scope: string, message: string, context?: LogContext) =>
  logger.warn(scope, message, context);

export const logError = (
  scope: string,
  message: string,
  context?: LogContext
) => logger.error(scope, message, context);

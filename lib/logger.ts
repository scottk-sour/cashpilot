/**
 * Structured logging utility for CashPilot
 *
 * This logger provides structured logging with different levels
 * and automatically includes contextual information like timestamps
 * and environment.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private environment: string
  private minLevel: LogLevel

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
    // In production, only log info and above by default
    this.minLevel = this.environment === 'production' ? 'info' : 'debug'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const minIndex = levels.indexOf(this.minLevel)
    const currentIndex = levels.indexOf(level)
    return currentIndex >= minIndex
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      environment: this.environment,
      message,
      ...context,
    }

    // In development, pretty print; in production, single line JSON
    if (this.environment === 'development') {
      return {
        prefix: `[${timestamp}] [${level.toUpperCase()}]`,
        message,
        context,
      }
    } else {
      return JSON.stringify(logEntry)
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return

    const formatted = this.formatMessage('debug', message, context)
    if (typeof formatted === 'string') {
      console.debug(formatted)
    } else {
      console.debug(formatted.prefix, formatted.message, formatted.context || '')
    }
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return

    const formatted = this.formatMessage('info', message, context)
    if (typeof formatted === 'string') {
      console.info(formatted)
    } else {
      console.info(formatted.prefix, formatted.message, formatted.context || '')
    }
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return

    const formatted = this.formatMessage('warn', message, context)
    if (typeof formatted === 'string') {
      console.warn(formatted)
    } else {
      console.warn(formatted.prefix, formatted.message, formatted.context || '')
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!this.shouldLog('error')) return

    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    }

    const formatted = this.formatMessage('error', message, errorContext)
    if (typeof formatted === 'string') {
      console.error(formatted)
    } else {
      console.error(formatted.prefix, formatted.message, formatted.context || '')
    }
  }

  // Convenience method for HTTP requests
  http(method: string, path: string, statusCode: number, duration?: number, context?: LogContext) {
    this.info(`${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    })
  }

  // Convenience method for database operations
  db(operation: string, table: string, duration?: number, context?: LogContext) {
    this.debug(`DB ${operation} on ${table}`, {
      operation,
      table,
      duration,
      ...context,
    })
  }
}

// Export a singleton instance
export const logger = new Logger()

// Export type for context
export type { LogContext }

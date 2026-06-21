export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  module?: string;
  [key: string]: unknown;
}

export function createLogger(module: string) {
  const log = (level: LogLevel, message: string, context?: LogContext) => {
    const entry = {
      level,
      module,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  };

  return {
    debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
    info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
    warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
    error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
  };
}

export const logger = createLogger('app');

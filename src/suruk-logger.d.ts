declare module '@yedoma-labs/suruk-logger' {
  interface LoggerOptions {
    name?: string;
    level?: string;
    pretty?: boolean;
    redact?: string[];
    base?: Record<string, unknown>;
  }

  interface Logger {
    info(msg: string, meta?: Record<string, unknown>): void;
    warn(msg: string, meta?: Record<string, unknown>): void;
    error(err: Error, meta?: Record<string, unknown>): void;
    error(msg: string, meta?: Record<string, unknown>): void;
    debug(msg: string, meta?: Record<string, unknown>): void;
  }

  export function createLogger(options?: LoggerOptions): Logger;
  export function setRequestLogger(logger: Logger): void;
  export function getRequestLogger(): Logger;
  export function runWithContext(context: Record<string, unknown>, fn: () => void): void;
  export function setContextValue(key: string, value: unknown): void;
  export function getContext(): Record<string, unknown>;
  export function bindRequestContext(logger: Logger): Logger;
}

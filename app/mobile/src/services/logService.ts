const CONFIG = {
  enabled: __DEV__,
}

export function enableLogs(enabled: boolean): void {
  CONFIG.enabled = enabled
}

export function log(...args: unknown[]): void {
  if (CONFIG.enabled) {
    console.log(...args)
  }
}

export function warn(...args: unknown[]): void {
  if (CONFIG.enabled) {
    console.warn(...args)
  }
}

export const logger = {
  log,
  warn,
  enable: () => enableLogs(true),
  disable: () => enableLogs(false),
}

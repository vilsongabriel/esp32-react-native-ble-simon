type LogLevel = "info" | "warn" | "error" | "debug"

const colors = {
  reset: "\x1b[0m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[35m",
  dim: "\x1b[2m",
}

function getTimestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: LogLevel, tag: string, message: string, ...args: unknown[]): string {
  const timestamp = colors.dim + getTimestamp() + colors.reset
  const levelColor = colors[level]
  const levelTag = levelColor + level.toUpperCase().padEnd(5) + colors.reset
  const formattedArgs = args.length > 0 ? " " + args.map((a) => JSON.stringify(a)).join(" ") : ""

  return `${timestamp} ${levelTag} [${tag}] ${message}${formattedArgs}`
}

export const logger = {
  info(tag: string, message: string, ...args: unknown[]): void {
    console.log(formatMessage("info", tag, message, ...args))
  },

  warn(tag: string, message: string, ...args: unknown[]): void {
    console.warn(formatMessage("warn", tag, message, ...args))
  },

  error(tag: string, message: string, ...args: unknown[]): void {
    console.error(formatMessage("error", tag, message, ...args))
  },

  debug(tag: string, message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatMessage("debug", tag, message, ...args))
    }
  },

  request(method: string, path: string, statusCode?: number): void {
    const status = statusCode ? ` -> ${statusCode}` : ""
    this.info("HTTP", `${method} ${path}${status}`)
  },
}

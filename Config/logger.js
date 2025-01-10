import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file"; // Import the daily rotate transport
const { combine, timestamp, printf, colorize, errors } = format;

// Define custom log levels and colors
const customLevels = {
  levels: {
    success: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  colors: {
    success: "green", // Success logs
    info: "magenta", // Info logs
    warn: "yellow", // Warning logs
    error: "red", // Errors logs
  },
};

// Custom log format (Square brackets around log level)
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return timestamp
    ? `${timestamp} [${level}]: ${stack || message}`
    : `${stack || message}`;
});

// Initialize Winston Logger with custom levels
const logger = createLogger({
  levels: customLevels.levels,
  level: "info",
  format: combine(errors({ stack: true })),
  transports: [
    // Console transport with colorization
    new transports.Console({
      level: "error",
      format: combine(
        colorize({ all: true, colors: customLevels.colors }),
        logFormat
      ),
    }),
    // Daily rotate transport for general logs
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log",
      level: "warn",
      maxsize: 5 * 1024 * 1024,
      maxFiles: "1d",
      format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
    }),
    // Daily rotate transport for error logs
    new DailyRotateFile({
      filename: "logs/errors-%DATE%.log",
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: "1d",
      format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
      filter: (log) => log.level === "error",
    }),
  ],
  exitOnError: false,
});

export default logger;

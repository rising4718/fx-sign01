import { createWriteStream } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private logLevel: LogLevel;
  private logStream?: NodeJS.WritableStream;

  constructor() {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.logLevel = LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
    
    // Create log stream if LOG_FILE is specified
    if (process.env.LOG_FILE) {
      try {
        this.logStream = createWriteStream(process.env.LOG_FILE, { flags: 'a' });
      } catch (error) {
        console.warn('Failed to create log file stream:', error);
      }
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  private log(level: LogLevel, levelName: string, message: string, ...args: any[]) {
    if (level > this.logLevel) return;

    const formattedMessage = this.formatMessage(levelName, message, ...args);
    
    // Console output with colors
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // White
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[levelName as keyof typeof colors] || ''}${formattedMessage}${reset}`);
    
    // File output (without colors)
    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }
}

export const logger = new Logger();
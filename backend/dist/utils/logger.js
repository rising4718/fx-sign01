"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
const fs_1 = require("fs");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        this.logLevel = LogLevel[level] || LogLevel.INFO;
        if (process.env.LOG_FILE) {
            try {
                this.logStream = (0, fs_1.createWriteStream)(process.env.LOG_FILE, { flags: 'a' });
            }
            catch (error) {
                console.warn('Failed to create log file stream:', error);
            }
        }
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') : '';
        return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
    }
    log(level, levelName, message, ...args) {
        if (level > this.logLevel)
            return;
        const formattedMessage = this.formatMessage(levelName, message, ...args);
        const colors = {
            ERROR: '\x1b[31m',
            WARN: '\x1b[33m',
            INFO: '\x1b[36m',
            DEBUG: '\x1b[37m'
        };
        const reset = '\x1b[0m';
        console.log(`${colors[levelName] || ''}${formattedMessage}${reset}`);
        if (this.logStream) {
            this.logStream.write(formattedMessage + '\n');
        }
    }
    error(message, ...args) {
        this.log(LogLevel.ERROR, 'ERROR', message, ...args);
    }
    warn(message, ...args) {
        this.log(LogLevel.WARN, 'WARN', message, ...args);
    }
    info(message, ...args) {
        this.log(LogLevel.INFO, 'INFO', message, ...args);
    }
    debug(message, ...args) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map
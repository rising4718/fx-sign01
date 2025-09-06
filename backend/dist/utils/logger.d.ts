export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
declare class Logger {
    private logLevel;
    private logStream?;
    constructor();
    private formatMessage;
    private log;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map
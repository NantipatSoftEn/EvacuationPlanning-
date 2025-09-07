import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLogger implements LoggerService {
    private logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
    private logDir = './logs';

    constructor() {
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(message: any, context?: string) {
        this.writeLog('INFO', message, context);
        console.log(`[${new Date().toISOString()}] [INFO] ${context ? `[${context}] ` : ''}${message}`);
    }

    error(message: any, trace?: string, context?: string) {
        this.writeLog('ERROR', message, context, trace);
        console.error(`[${new Date().toISOString()}] [ERROR] ${context ? `[${context}] ` : ''}${message}`, trace);
    }

    warn(message: any, context?: string) {
        this.writeLog('WARN', message, context);
        console.warn(`[${new Date().toISOString()}] [WARN] ${context ? `[${context}] ` : ''}${message}`);
    }

    debug(message: any, context?: string) {
        this.writeLog('DEBUG', message, context);
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${new Date().toISOString()}] [DEBUG] ${context ? `[${context}] ` : ''}${message}`);
        }
    }

    verbose(message: any, context?: string) {
        this.writeLog('VERBOSE', message, context);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${new Date().toISOString()}] [VERBOSE] ${context ? `[${context}] ` : ''}${message}`);
        }
    }

    private writeLog(level: string, message: any, context?: string, trace?: string) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            context,
            message: typeof message === 'object' ? JSON.stringify(message) : message,
            trace
        };

        // Write to daily log file
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `${today}.log`);
        
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

        // Write errors to separate error log
        if (level === 'ERROR') {
            const errorFile = path.join(this.logDir, `${today}-error.log`);
            fs.appendFileSync(errorFile, JSON.stringify(logEntry) + '\n');
        }
    }
}

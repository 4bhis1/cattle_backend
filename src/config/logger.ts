import winston from 'winston';
import path from 'path';
import features from './features';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const configLevel = features.logging.level || 'info';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : configLevel;
};

// Colors for console logging
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const transports = [
    // Console transport
    new winston.transports.Console({
        format: combine(
            colorize({ all: true }),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            logFormat
        ),
    }),
    // Error log file
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(timestamp(), json()),
    }),
    // Combined log file
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: combine(timestamp(), json()),
    }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});

export default logger;

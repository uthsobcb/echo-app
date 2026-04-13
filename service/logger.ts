/**
 * Lightweight logger that can be silenced in production.
 * In __DEV__ mode every level prints; in production only warnings and errors do.
 */

const isDev = __DEV__;

export const logger = {
    debug(...args: unknown[]) {
        if (isDev) console.log(...args);
    },
    info(...args: unknown[]) {
        if (isDev) console.info(...args);
    },
    warn(...args: unknown[]) {
        console.warn(...args);
    },
    error(...args: unknown[]) {
        console.error(...args);
    },
};

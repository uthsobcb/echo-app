/**
 * Centralised app configuration.
 *
 * Values can be overridden via Expo Constants (extra) which are fed from
 * app.config.js / .env at build time.  Fall back to sensible defaults so
 * the app still works out of the box during development.
 */
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
    /** Base URL for the Echo REST API */
    API_BASE_URL: (extra.API_BASE_URL as string) || 'https://echo-next.vercel.app/api',
} as const;

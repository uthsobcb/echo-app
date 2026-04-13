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

    /**
     * Google OAuth client IDs from Google Cloud Console.
     * Web client ID is required; iOS/Android IDs are optional for dev but needed for production builds.
     */
    GOOGLE_WEB_CLIENT_ID: (extra.GOOGLE_WEB_CLIENT_ID as string) || '424659230342-o6nedcm2crin3llr7ouoeopntq856m8v.apps.googleusercontent.com',
    GOOGLE_IOS_CLIENT_ID: (extra.GOOGLE_IOS_CLIENT_ID as string) || '',
    GOOGLE_ANDROID_CLIENT_ID: (extra.GOOGLE_ANDROID_CLIENT_ID as string) || '',
} as const;

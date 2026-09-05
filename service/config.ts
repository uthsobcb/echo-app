/**
 * Centralised app configuration.
 *
 * Values can be overridden via Expo Constants (extra) which are fed from
 * app.config.js / .env at build time.  Fall back to sensible defaults so
 * the app still works out of the box during development.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};

// The API sends no CORS headers, so `expo start --web` can't call it directly —
// route through the dev-only proxy in metro.config.js instead. Native has no CORS
// and production web is a static export with no proxy, so this only applies in
// the web dev server.
const defaultApiBaseUrl =
    Platform.OS === 'web' && __DEV__ ? '/api-proxy' : 'https://echo-next.vercel.app/api';

export const config = {
    /** Base URL for the Echo REST API */
    API_BASE_URL: (extra.API_BASE_URL as string) || defaultApiBaseUrl,
} as const;

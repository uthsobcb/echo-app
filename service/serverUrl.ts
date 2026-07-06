/**
 * Turn a pasted/deep-linked self-hosted server address into an Echo API base URL.
 * "echo.example.com" -> "https://echo.example.com/api"
 * Returns '' when there is nothing usable.
 */
export function normalizeServerUrl(input: string): string {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return /\/api$/i.test(withScheme) ? withScheme : `${withScheme}/api`;
}

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const https = require('https');

const config = getDefaultConfig(__dirname)

// ponytail: the Echo API sends no Access-Control-Allow-Origin header at all (verified
// via curl — absent for every Origin tried, including the API's own domain), so the
// browser blocks every fetch() from `expo start --web` regardless of route. CORS is
// enforced by the browser, not fixable from client code — the real fix is CORS headers
// on the API. Until then, proxy /api-proxy/* through the dev server (server-to-server
// requests aren't subject to CORS) so local web dev can actually hit the live API.
// See service/config.ts — only wired up for Platform.OS === 'web' && __DEV__.
const API_PROXY_PREFIX = '/api-proxy/';
const API_HOST = 'echo-next.vercel.app';

config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => (req, res, next) => {
        if (!req.url || !req.url.startsWith(API_PROXY_PREFIX)) {
            return middleware(req, res, next);
        }
        const proxyReq = https.request(
            {
                hostname: API_HOST,
                path: req.url.replace('/api-proxy', '/api'),
                method: req.method,
                headers: { ...req.headers, host: API_HOST },
            },
            (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
                proxyRes.pipe(res);
            },
        );
        proxyReq.on('error', (err) => {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
        });
        req.pipe(proxyReq);
    },
};

module.exports = withNativeWind(config, { input: './global.css' })

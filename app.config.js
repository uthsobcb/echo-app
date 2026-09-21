// app.json holds the static config. This file only exists to inject the
// CodePush deployment key/server from the environment at build time, since
// plain JSON can't read process.env and that key shouldn't be hardcoded in
// a file that gets committed. Everything else stays defined in app.json.
module.exports = ({ config }) => ({
    ...config,
    plugins: (config.plugins || []).map((plugin) => {
        const name = Array.isArray(plugin) ? plugin[0] : plugin;
        if (name !== '@revopush/expo-code-push-plugin') return plugin;

        const CodePushDeploymentKey = process.env.CODEPUSH_DEPLOYMENT_KEY || '';
        const CodePushServerUrl = process.env.CODEPUSH_SERVER_URL || 'https://api.revopush.org';
        return [name, {
            ios: { CodePushDeploymentKey, CodePushServerUrl },
            android: { CodePushDeploymentKey, CodePushServerUrl },
        }];
    }),
});

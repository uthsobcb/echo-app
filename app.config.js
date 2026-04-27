module.exports = ({ config }) => ({
    ...config,
    plugins: [
        ["@revopush/expo-code-push-plugin", {
            ios: {
                CodePushDeploymentKey: 'DYsmRU7y1AUPNYVzveK2ipOD39NjNJWJhD4pQl',
                CodePushServerUrl: 'https://api.revopush.org'
            },
            android: {
                CodePushDeploymentKey: 'DYsmRU7y1AUPNYVzveK2ipOD39NjNJWJhD4pQl',
                CodePushServerUrl: 'https://api.revopush.org'
            }
        }]
    ],
});
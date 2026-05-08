module.exports = ({ config }) => ({
    ...config,
    icon: './assets/images/EchoLogo.png',
    android: {
        ...config.android,
        adaptiveIcon: {
            backgroundColor: '#0B71C4',
            foregroundImage: './assets/images/EchoLogo.png',
            monochromeImage: './assets/images/EchoLogo.png',
        },
    },
    plugins: [
        'expo-router',
        [
            'expo-splash-screen',
            {
                image: './assets/images/EchoLogo.png',
                imageWidth: 220,
                resizeMode: 'contain',
                backgroundColor: '#0B71C4',
                dark: {
                    image: './assets/images/EchoLogo.png',
                    backgroundColor: '#060A14',
                },
            },
        ],
        [
            '@revopush/expo-code-push-plugin',
            {
                ios: {
                    CodePushDeploymentKey: 'DYsmRU7y1AUPNYVzveK2ipOD39NjNJWJhD4pQl',
                    CodePushServerUrl: 'https://api.revopush.org',
                },
                android: {
                    CodePushDeploymentKey: 'DYsmRU7y1AUPNYVzveK2ipOD39NjNJWJhD4pQl',
                    CodePushServerUrl: 'https://api.revopush.org',
                },
            },
        ],
        'expo-speech-recognition',
    ],
});

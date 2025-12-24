import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Chatterly',
    slug: 'chatterly',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0ea5e9',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.chatterly.app',
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#0ea5e9',
        },
        package: 'com.chatterly.app',
    },
    web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
    },
    scheme: 'chatterly',
    extra: {
        firebase: {
            apiKey: 'AIzaSyB0tOHpD1TZZx9VUEnzZH2Gp23jR4OVH0k',
            authDomain: 'chatterly-327d6.firebaseapp.com',
            projectId: 'chatterly-327d6',
            storageBucket: 'chatterly-327d6.firebasestorage.app',
            messagingSenderId: '933413732224',
            appId: '1:933413732224:web:00e20dc10a51ec8dff8b65',
        },
        backendUrl: 'http://localhost:3001',
    },
    plugins: ['expo-router'],
});

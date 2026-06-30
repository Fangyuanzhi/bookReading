/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: '陪读',
  slug: 'peidu',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAFAF9',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.peidu.mobile',
    buildNumber: '1',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2563EB',
    },
    package: 'app.peidu.mobile',
    versionCode: 1,
    // 开发/内测阶段后端多为 HTTP，真机需允许明文流量
    usesCleartextTraffic: true,
  },
  extra: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      config?.extra?.apiUrl ||
      'http://localhost:8080/api/v1',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL,
  },
});

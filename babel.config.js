const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      expoRouterBabelPlugin,
      [
        'module-resolver',
        {
          root: ['./mobile/src'],
          alias: {
            '~': './mobile/src',
            '@frigi/shared': './shared/src/index.ts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

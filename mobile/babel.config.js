const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // In this workspace layout expo-router resolves from `mobile/node_modules`,
      // so `babel-preset-expo` cannot auto-detect it from the hoisted preset location.
      expoRouterBabelPlugin,
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '~': './src',
            '@frigi/shared': '../shared/src/index.ts',
          },
        },
      ],
      // react-native-reanimated MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};

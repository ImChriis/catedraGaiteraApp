module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Otros plugins si tienes
      'react-native-worklets/plugin', // <--- Cambia esto si usas Reanimated 3+
    ],
  };
};
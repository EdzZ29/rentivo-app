module.exports = function (api) {
  api.cache(true);
  // Nativewind v5 rewrites `className` through its own babel preset and a Metro
  // resolver polyfill — there's no `jsxImportSource` to set any more.
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
  };
};

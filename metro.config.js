const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// v5 picks the stylesheet up from the `import` in the root layout rather than
// from an `input` option, so there's nothing to point it at here.
module.exports = withNativeWind(config);

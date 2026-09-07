// Expo's Metro CSS pipeline is what actually runs Tailwind — Nativewind v5
// hands the compiled CSS off to it, so without this the stylesheet comes out
// empty and every `className` is silently ignored.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

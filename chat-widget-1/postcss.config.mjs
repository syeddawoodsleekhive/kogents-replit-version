/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // Ensures keyframes & animations work across browsers
    "postcss-100vh-fix": {}, // Fixes mobile viewport height issues (common with animated elements)
  },
};

export default config;

const materialColors = require("./src/material-colors.js");

module.exports = {
  purge: [
    './src/**/*.html',
    './src/**/*.css',
    './src/**/*.ts',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {...materialColors }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

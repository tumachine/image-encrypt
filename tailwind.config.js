const materialColors = require("./src/material-colors.js");

module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        ...materialColors,
        // green: {
        //   DEFAULT: '#00ff00',
        // },
        // red: {
        //   DEFAULT: '#ff0000',
        // },
        // blue: {
        //   DEFAULT: '#0000ff',
        // }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

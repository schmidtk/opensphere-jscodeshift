module.exports = {
  "extends": "eslint:recommended",
  "env": {
    "es6": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2020
  },
  "rules": {
    // require let/const, and prefer const
    "no-var": "error",
    "prefer-const": "error",

    // allow unused function arguments
    "no-unused-vars": ["error", {"args": "none"}]
  }
};

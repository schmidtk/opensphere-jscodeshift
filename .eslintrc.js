module.exports = {
  "extends": "eslint:recommended",
  "env": {
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    // require let/const, and prefer const
    "no-var": "error",
    "prefer-const": "error",

    // allow unused function arguments
    "no-unused-vars": ["error", {"args": "none"}]
  }
};

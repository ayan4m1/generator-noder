module.exports = {
  "env": {
    "es2020": true,
    <% if (flags.addJest) { %>
    "jest": true,
    <% } %>
    "node": true
  },
  "extends": [
    "eslint:recommended",
    <% if (flags.addJest) { %>
    "plugin:jest/recommended",
    <% } %>
    "plugin:prettier/recommended",
    "plugin:import/recommended"
  ],
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "requireConfigFile": false,
    "ecmaVersion": 12
  },
  "settings": {
    "import/resolver": {
      node: {
        paths: ['./src']
      }
    }
  }
};

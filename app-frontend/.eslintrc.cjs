module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-empty-any": 0,
    "@typescript-eslint/no-shadow": 0,
    "@typescript-eslint/no-use-before-define": [
      "error",
      "nofunc"
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "args": "none"
      }
    ],
    "@typescript-eslint/no-explicit-any": 0,
    "camelcase": 0,
    "import/no-extraneous-dependencies": 0,
    "class-methods-use-this": 0,
    "import/extensions": 0,
    "import/no-unresolved": 0,
    "import/prefer-default-export": 0,
    "keyword-spacing": "error",
    "max-classes-per-file": 0,
    "max-len": 0,
    "no-await-in-loop": 0,
    "no-bitwise": 0,
    "no-console": 0,
    "no-restricted-syntax": 0,
    "no-shadow": 1,
    "no-underscore-dangle": 0,
    "no-use-before-define": 0,
    "no-useless-constructor": 0,
    "no-async-promise-executor": 0,
    "no-multiple-empty-lines": 1,
    "semi": [
      "error",
      "never"
    ],
    "quote-props": [
      "error",
      "consistent"
    ],
    "quotes": [
      "error",
      "double"
    ]
  },
}

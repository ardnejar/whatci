module.exports = {
  // Default settings
  singleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'always',
  tabWidth: 2,
  printWidth: 130,
  semi: false,
  overrides: [
    {
      files: '*.jsonc',
      options: {
        trailingComma: 'none',
      },
    },
  ],
}

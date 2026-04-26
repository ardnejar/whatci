import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/naming-convention': [
        // https://typescript-eslint.io/rules/naming-convention/
        // https://typescript-eslint.io/rules/naming-convention/#allowed-selectors-modifiers-and-types
        'error',
        {
          selector: 'class',
          format: ['PascalCase']
        },
        {
          selector: ['function', 'classMethod'],
          format: ['camelCase']
        },
        {
          selector: 'variable',
          types: ['function'],
          format: ['camelCase'],
        },
        {
          selector: 'variable',
          types: ['boolean', 'string', 'number', 'array'],
          format: ['snake_case'],
        },
        {
          selector: ['parameter', 'classProperty'],
          types: ['boolean', 'string', 'number', 'array'],
          format: ['snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: ['parameter', 'classProperty'],
          types: ['function'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          modifiers: ['global', 'const'],
          types: ['function'],
          format: ['PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['global', 'const'],
          types: ['boolean', 'string', 'number', 'array'],
          format: ['UPPER_CASE'],
        },
      ],
    },
  },
];
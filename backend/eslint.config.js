const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Base recommended config
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'logs/**',
      'dist/**',
      'build/**',
      '*.config.js',
      'eslint.config.js',
    ],
  },

  // Main application files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Error prevention
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Best practices
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'no-implied-eval': 'error',
      // 'no-return-await': 'error',
      'require-await': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Async/Promise handling
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',

      // Security
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Code quality
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-nested-callbacks': ['warn', 4],
      'max-params': ['warn', 5],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],

      // Node.js specific
      'no-path-concat': 'error',
      // 'no-process-exit': 'warn',
      'handle-callback-err': 'error',

      // Style consistency (if not using Prettier)
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },

  // Test files - relaxed rules
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'max-nested-callbacks': 'off',
      'max-lines-per-function': 'off',
      'no-process-exit': 'off',
    },
  },

  // Configuration files
  {
    files: ['*.config.js', 'config/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-process-exit': 'off',
    },
  },

  // Scripts and utilities
  {
    files: ['scripts/**/*.js', 'populate.js'],
    rules: {
      'no-console': 'off',
      'no-process-exit': 'off',
    },
  },
];

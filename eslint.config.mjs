import xo from 'eslint-config-xo'
import xoBrowser from 'eslint-config-xo/browser'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import globals from 'globals'

export default [
  eslintPluginImport.flatConfigs.errors,
  eslintPluginImport.flatConfigs.warnings,
  eslintPluginUnicorn.configs.recommended,
  ...xo,
  ...xoBrowser,
  {
    ignores: [
      '**/*.json',
      '**/*.min.js',
      '**/dist/',
      '.babelrc.js',
      'supabase/functions/**/*.ts'
    ]
  },
  {
    rules: {
      '@stylistic/comma-dangle': 'off',
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/jsx-quotes': 'off',
      '@stylistic/max-len': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/semi': 'off',
      'arrow-body-style': 'off',
      'capitalized-comments': 'off',
      'comma-dangle': ['error', 'never'],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always'
        }
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',
      'import/no-amd': 'error',
      'import/no-cycle': [
        'error',
        {
          ignoreExternal: true
        }
      ],
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-named-default': 'error',
      'import/no-self-import': 'error',
      'import/no-unassigned-import': ['error'],
      'import/no-useless-path-segments': 'error',
      'import/order': 'error',
      indent: [
        'error',
        2,
        {
          MemberExpression: 'off',
          SwitchCase: 1
        }
      ],
      'logical-assignment-operators': 'off',
      'max-params': ['warn', 5],
      'multiline-ternary': ['error', 'always-multiline'],
      'new-cap': [
        'error',
        {
          properties: false
        }
      ],
      'no-console': 'error',
      'no-negated-condition': 'off',
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': ['error', 'after'],
      'prefer-object-has-own': 'off',
      'prefer-template': 'error',
      semi: ['error', 'never'],
      strict: 'error',
      'unicorn/explicit-length-check': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-anonymous-default-export': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-method-this-argument': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-typeof-undefined': 'off',
      'unicorn/no-unused-properties': 'error',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/prefer-array-flat': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-dom-node-dataset': 'off',
      'unicorn/prefer-global-this': 'off', // added to avoid the error: 'Use `globalThis` instead of `window` or `global`'
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/prefer-structured-clone': 'off',
      'unicorn/prevent-abbreviations': 'off'
    }
  },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  {
    files: ['**/*.{js,mjs}'],
    rules: {
      '@stylistic/brace-style': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/eol-last': 'off',
      '@stylistic/empty-line-between-statements': 'off',
      '@stylistic/indentation': 'off',
      '@stylistic/key-spacing': 'off',
      '@stylistic/keyword-spacing': 'off',
      '@stylistic/no-mixed-operators': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/no-trailing-spaces': 'off',
      '@stylistic/padded-blocks': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      '@stylistic/semi-style': 'off',
      '@stylistic/space-before-blocks': 'off',
      '@stylistic/space-infix-ops': 'off',
      camelcase: 'off',
      'comma-dangle': 'off',
      complexity: 'off',
      'import/first': 'off',
      'import/newline-after-import': 'off',
      'import/no-unassigned-import': 'off',
      'import/order': 'off',
      'default-case': 'off',
      indent: 'off',
      'max-lines': 'off',
      'max-params': 'off',
      'multiline-ternary': 'off',
      'new-cap': 'off',
      'no-alert': 'off',
      'no-await-in-loop': 'off',
      'no-console': 'off',
      'no-empty': 'off',
      'no-multi-assign': 'off',
      'no-new': 'off',
      'no-promise-executor-return': 'off',
      'no-restricted-globals': 'off',
      'no-return-await': 'off',
      'no-unused-vars': 'off',
      'object-curly-spacing': 'off',
      'object-shorthand': 'off',
      'operator-linebreak': 'off',
      'prefer-template': 'off',
      'prefer-destructuring': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/empty-brace-spaces': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-array-reverse': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-immediate-mutation': 'off',
      'unicorn/no-unused-properties': 'off',
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/prefer-dom-node-append': 'off',
      'unicorn/prefer-dom-node-remove': 'off',
      'unicorn/prefer-number-properties': 'off',
      'unicorn/prefer-set-has': 'off',
      'unicorn/switch-case-braces': 'off',
      'unicode-bom': 'off'
    }
  },

  {
    files: ['build/**'],
    languageOptions: {
      globals: {
        ...globals.node
      },
      sourceType: 'module'
    },
    rules: {
      'no-console': 'off',
      'unicorn/prefer-top-level-await': 'off'
    }
  }
]

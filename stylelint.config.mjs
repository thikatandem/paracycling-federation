export default {
  extends: ['stylelint-config-twbs-bootstrap/scss'],
  overrides: [
    {
      files: ['src/scss/style.scss'],
      rules: {
        '@stylistic/declaration-colon-space-after': null,
        '@stylistic/indentation': null,
        '@stylistic/max-empty-lines': null,
        '@stylistic/no-missing-end-of-source-newline': null,
        'color-hex-length': null,
        'color-named': null,
        'declaration-no-important': null,
        'declaration-property-value-disallowed-list': null,
        'function-disallowed-list': null,
        'no-duplicate-selectors': null,
        'order/properties-order': null,
        'property-disallowed-list': null,
        'property-no-vendor-prefix': null,
        'selector-id-pattern': null,
        'selector-max-id': null
      }
    }
  ]
}

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        // `@babel/polyfill` is imported in app.js, so no core-js injection here.
        useBuiltIns: false,
      },
    ],
    ['@babel/preset-react', { runtime: 'classic' }],
  ],
  plugins: ['@babel/plugin-transform-class-properties'],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'classic' }],
      ],
    },
  },
};

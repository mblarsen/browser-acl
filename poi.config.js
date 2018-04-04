module.exports = {
  entry: 'index.js',
  html: false,
  vendor: false,
  format: 'cjs',
  sourceMap: false,
  filename: {js: `browser-acl.js`},
  presets: [
    require('poi-preset-babel-minify')()
  ]
}

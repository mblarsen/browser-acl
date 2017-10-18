const pkg = require('./package.json')
module.exports = {
  html: false,
  vendor: false,
  filename: {js: `browser-acl-${pkg.version}.js`},
}

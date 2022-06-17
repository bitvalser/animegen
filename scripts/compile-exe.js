const { compile } = require('nexe');
const package = require('../package.json');

compile({
  input: `lib/animegen-${package.version}.js`,
  output: 'animegen.exe',
}).then(() => {
  console.log('success');
});

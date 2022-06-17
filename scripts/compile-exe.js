const { compile } = require('nexe');
const fs = require('fs-extra');
const package = require('../package.json');

compile({
  input: `lib/animegen-${package.version}.js`,
  targets: [
    {
      arch: 'x64',
      platform: 'windows',
    },
  ],
  output: 'animegen-x64/animegen.exe',
}).then(() => {
  fs.copyFileSync(
    `lib/animegen-${package.version}.js.LICENSE.txt`,
    `animegen-x64/animegen-${package.version}.js.LICENSE.txt`,
  );
  fs.copySync('node_modules/sharp/lib', 'animegen-x64/node_modules/sharp/lib');
  fs.copySync('node_modules/sharp/build', 'animegen-x64/node_modules/sharp/build');
  console.log('success');
});

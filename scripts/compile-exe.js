const { compile } = require('nexe');
const fs = require('fs-extra');
const package = require('../package.json');
const dotenv = require('dotenv');
dotenv.config();

const APP_FOLDER = 'animegen-x64';

compile({
  input: `lib/animegen-${package.version}.js`,
  targets: [
    {
      arch: 'x64',
      platform: 'windows',
    },
  ],
  output: `${APP_FOLDER}/animegen.exe`,
}).then(() => {
  fs.copyFileSync(
    `lib/animegen-${package.version}.js.LICENSE.txt`,
    `${APP_FOLDER}/animegen-${package.version}.js.LICENSE.txt`,
  );
  fs.copySync('node_modules/sharp/lib', `${APP_FOLDER}/node_modules/sharp/lib`);
  fs.copySync('node_modules/sharp/build', `${APP_FOLDER}/node_modules/sharp/build`);

  fs.mkdirSync(`${APP_FOLDER}/libs`);
  fs.copyFileSync(process.env.FFMPEG_PATH, `${APP_FOLDER}/libs/ffmpeg.exe`);
  console.log('success');
});

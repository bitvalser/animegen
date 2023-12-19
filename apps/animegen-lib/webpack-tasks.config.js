const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const rimraf = require('rimraf');

module.exports = {
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  entry: fs.readdirSync(path.join(__dirname, 'src/tasks')).reduce(
    (acc, taskFile) => ({
      ...acc,
      [taskFile.replace('.ts', '')]: path.join(__dirname, `src/tasks/${taskFile}`),
    }),
    {},
  ),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.FLUENTFFMPEG_COV': false,
      'process.env.YTDL_NO_UPDATE': true,
    }),
    new (class {
      apply(compiler) {
        compiler.hooks.done.tap('Remove LICENSE', () => {
          rimraf.sync(path.resolve(__dirname, 'lib/tasks/*.LICENSE.txt'));
        });
      }
    })(),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'lib/tasks'),
  },
  optimization: {
    minimize: true,
  },
};

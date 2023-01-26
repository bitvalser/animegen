const path = require('path');
const webpack = require('webpack');
const package = require('./package.json');

module.exports = {
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  entry: path.join(__dirname, 'src/index-lib.ts'),
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
  ],
  output: {
    filename: `animegen-${package.version}.js`,
    path: path.resolve(__dirname, 'lib'),
    library: 'animegen',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  optimization: {
    minimize: true,
  },
  externals: {
    sharp: 'commonjs sharp',
  },
};

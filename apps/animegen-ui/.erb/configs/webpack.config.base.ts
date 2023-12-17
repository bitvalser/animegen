/**
 * Base webpack config used across other specific configs
 */
import webpack from 'webpack';
import dotenv from 'dotenv';
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin';
import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

if (process.env.NODE_ENV !== 'production') {
  dotenv.configDotenv({
    path: '.dev.env',
    override: true,
  });
} else {
  dotenv.configDotenv({
    path: '.env',
    override: true,
  });
}

const configuration: webpack.Configuration = {
  externals: [...Object.keys(externals || {}), 'sharp'],

  stats: 'errors-only',

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
            },
          },
        },
      },
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    // There is no need to add aliases here, the paths in tsconfig get mirrored
    plugins: [new TsconfigPathsPlugins()],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
    new webpack.DefinePlugin({
      'process.env.FLUENTFFMPEG_COV': false,
      'process.env.YTDL_NO_UPDATE': true,
    }),
  ],
};

export default configuration;

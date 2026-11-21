const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const root = __dirname;
const resolveFromRoot = dir => path.resolve(root, dir);

module.exports = (env, argv = {}) => {
  const isProduction = argv.mode === 'production';
  const cssLoader = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: resolveFromRoot('app.js'),
    output: {
      path: resolveFromRoot('build'),
      publicPath: '/',
      filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
      chunkFilename: isProduction
        ? '[name].[contenthash:8].chunk.js'
        : '[name].chunk.js',
      clean: true,
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        components: resolveFromRoot('components'),
        containers: resolveFromRoot('containers'),
        utils: resolveFromRoot('utils'),
        images: resolveFromRoot('images'),
        sass: resolveFromRoot('sass'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.s?css$/,
          use: [
            cssLoader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isProduction,
                importLoaders: 1,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !isProduction,
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: { maxSize: 8 * 1024 },
          },
          generator: {
            filename: 'media/[name].[hash:8][ext]',
          },
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]',
          },
        },
        {
          test: /\.(mp4|webm|ogg|mp3|wav)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'media/[name].[hash:8][ext]',
          },
        },
        {
          test: /\.htaccess$/,
          type: 'asset/resource',
          generator: {
            filename: '.htaccess',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: resolveFromRoot('index.html'),
        inject: 'body',
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: '[name].[contenthash:8].css',
              chunkFilename: '[name].[contenthash:8].chunk.css',
            }),
          ]
        : []),
    ],
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
      },
    },
    performance: {
      hints: false,
    },
  };
};

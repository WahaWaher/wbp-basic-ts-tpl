const fs = require('fs');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const { paths } = require('./utils/paths');
const { isDev, isProd } = require('./utils/mode');

module.exports = {
  target: isDev ? 'web' : 'browserslist',
  devtool: isDev && 'inline-source-map',
  devServer: {
    port: 3000,
    hot: true,
    compress: true,
    open: false,
    watchFiles: ['src/**/*.html'],
  },
  entry: {
    app: paths.appEntry,
  },
  output: {
    filename: isDev ? '[name].js' : 'js/[name].[contenthash:6].js',
    path: paths.appBuild,
    clean: isProd,
    assetModuleFilename: '[name][ext]',
  },
  optimization: {
    minimize: isProd,
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': paths.appSrc,
      '~': `${paths.appRoot}/node_modules`,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/i,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(css|scss)$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          isProd && 'postcss-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: { sourceMap: true },
          },
        ].filter(Boolean),
      },
      {
        test: /\.(png|svg|jpe?g|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name].[contenthash:6][ext][query]',
        },
        parser: {
          dataUrlCondition: { maxSize: 1024 * 5 },
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:6][ext][query]',
        },
      },
      {
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          preprocessor: (content, loaderContext) =>
            content.replace(
              /<include src="(.+)"\s*\/?>(?:<\/include>)?/gi,
              (m, src) => {
                const filePath = path.resolve(loaderContext.context, src);

                loaderContext.dependency(filePath);

                return fs.readFileSync(filePath, 'utf8');
              }
            ),
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isDev ? '[name].css' : 'css/[name].[contenthash:6].css',
    }),
    new ForkTsCheckerWebpackPlugin(),
    new CopyPlugin({
      patterns: [{ from: paths.appPublic, to: paths.appBuild }],
    }),
    /**
     * Imagemin
     * Lossless optimization with custom option
     */
    // new ImageMinimizerPlugin({
    //   test: /\.(jpe?g|png|gif|svg)$/i,
    //   loader: false,
    //   minimizerOptions: {
    //     plugins: [
    //       ['gifsicle', { interlaced: true }],
    //       ['jpegtran', { progressive: true }],
    //       ['optipng', { optimizationLevel: 5 }],
    //       // Svgo configuration here https://github.com/svg/svgo#configuration
    //       [
    //         'svgo',

    //         {
    //           plugins: [
    //             {
    //               name: 'preset-default',
    //               params: {
    //                 overrides: {
    //                   name: 'removeViewBox',
    //                   active: false,
    //                 },
    //               },
    //             },
    //             {
    //               name: 'preset-default',
    //               params: {
    //                 overrides: {
    //                   name: 'addAttributesToSVGElement',
    //                   params: {
    //                     attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
    //                   },
    //                 },
    //               },
    //             },
    //           ],
    //         },
    //       ],
    //     ],
    //   },
    // }),

    /**
     * Squoosh (loseless)
     * (need update)
     * https://github.com/webpack-contrib/image-minimizer-webpack-plugin/issues/222
     */
    // new ImageMinimizerPlugin({
    //   minify: ImageMinimizerPlugin.squooshMinify,
    //   minimizerOptions: {
    //     encodeOptions: {
    //       mozjpeg: {
    //         quality: 100,
    //       },
    //       webp: {
    //         lossless: 1,
    //       },
    //       avif: {
    //         cqLevel: 0,
    //       },
    //     },
    //   },
    // }),
  ]
    .concat(
      ['index.html', 'about.html'].map(
        (filename) =>
          new HtmlWebpackPlugin({
            filename,
            template: `${paths.appSrc}/${filename}`,
            favicon: './src/img/favicon.ico',
            inject: 'body',
            minify: isProd,
          })
      )
    )
    .filter(Boolean),
};

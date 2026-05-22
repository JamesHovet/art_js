const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  entry: {
    spiral: './projects/spiral/spiral.ts',
    letters: './projects/letters/letters.ts',
    messy: './projects/messy/messy.ts',
    slice: './projects/slice/slice.ts',
    tiles: './projects/tiles/tiles.ts',
    tree: './projects/tree/tree.ts',
    tree_timeline: './projects/tree_timeline/tree_timeline.ts',
    template: './projects/template/template.ts',
    storm: './projects/storm/storm.ts',
    tree_data: './projects/tree_data/tree_data.ts',
    cloud_lines_tmp: './projects/cloud_lines_tmp/cloud_lines_tmp.ts',
    cloud: './projects/cloud/cloud.ts',
    plotter_testing: './projects/plotter_testing/plotter_testing.ts',
    letter_walk: './projects/letter_walk/letter_walk.ts',
    studio_landing:         './studio/landing/landing.ts',
    studio_spiral_collect:  './studio/spiral/collect.ts',
    studio_spiral_render:   './studio/spiral/render.ts',
    studio_letters_collect: './studio/letters/collect.ts',
    studio_letters_render:  './studio/letters/render.ts',
    studio_tree_collect:    './studio/tree/collect.ts',
    studio_tree_render:     './studio/tree/render.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './js/[name].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.GOOGLE_MAPS_API_KEY),
    }),
    new HtmlWebpackPlugin({
      template: './projects/spiral/spiral.html',
      filename: 'spiral/index.html',
      chunks: ['spiral'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/letters/letters.html',
      filename: 'letters/index.html',
      chunks: ['letters'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/messy/messy.html',
      filename: 'messy/index.html',
      chunks: ['messy'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/slice/slice.html',
      filename: 'slice/index.html',
      chunks: ['slice'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/tiles/tiles.html',
      filename: 'tiles/index.html',
      chunks: ['tiles'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/tree/tree.html',
      filename: 'tree/index.html',
      chunks: ['tree'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/tree_timeline/tree_timeline.html',
      filename: 'tree_timeline/index.html',
      chunks: ['tree_timeline'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/template/template.html',
      filename: 'template/index.html',
      chunks: ['template'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/tree_data/tree_data.html',
      filename: 'tree_data/index.html',
      chunks: ['tree_data'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/cloud_lines_tmp/cloud_lines_tmp.html',
      filename: 'cloud_lines_tmp/index.html',
      chunks: ['cloud_lines_tmp'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/cloud/cloud.html',
      filename: 'cloud/index.html',
      chunks: ['cloud'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/plotter_testing/plotter_testing.html',
      filename: 'plotter_testing/index.html',
      chunks: ['plotter_testing'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/storm/storm.html',
      filename: 'storm/index.html',
      chunks: ['storm'],
    }),
    new HtmlWebpackPlugin({
      template: './projects/letter_walk/letter_walk.html',
      filename: 'letter_walk/index.html',
      chunks: ['letter_walk'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/landing/landing.html',
      filename: 'studio_landing/index.html',
      chunks: ['studio_landing'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/spiral/collect.html',
      filename: 'studio_spiral_collect/index.html',
      chunks: ['studio_spiral_collect'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/spiral/render.html',
      filename: 'studio_spiral_render/index.html',
      chunks: ['studio_spiral_render'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/letters/collect.html',
      filename: 'studio_letters_collect/index.html',
      chunks: ['studio_letters_collect'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/letters/render.html',
      filename: 'studio_letters_render/index.html',
      chunks: ['studio_letters_render'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/tree/collect.html',
      filename: 'studio_tree_collect/index.html',
      chunks: ['studio_tree_collect'],
    }),
    new HtmlWebpackPlugin({
      template: './studio/tree/render.html',
      filename: 'studio_tree_render/index.html',
      chunks: ['studio_tree_render'],
    }),
    new CopyPlugin({
      patterns: [
        { from: 'p5.axidraw.js', to: 'vendor/p5.axidraw.js' },
        { from: 'studio/shared/studio.css', to: 'studio_shared.css' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
    extensionAlias: {
      ".js" : [".js", ".ts"]
    }
  },
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" }
    ]
  }
};

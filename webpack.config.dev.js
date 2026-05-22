const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    liveReload: true,
    hot: true,
    open: '/spiral',
    static: ['./'],
    historyApiFallback: {
      rewrites: [
        { from: /^\/spiral/, to: '/spiral/index.html' },
        { from: /^\/letters/, to: '/letters/index.html' },
        { from: /^\/slice/, to: '/slice/index.html' },
        { from: /^\/messy/, to: '/messy/index.html' },
        { from: /^\/tree_timeline/, to: '/tree_timeline/index.html' },
        { from: /^\/tree_data/, to: '/tree_data/index.html' },
        { from: /^\/tree/, to: '/tree/index.html' },
        { from: /^\/template/, to: '/template/index.html' }
      ],
    },
  },
});

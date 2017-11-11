var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    'ui-scroll': '../src/ui-scroll.js',
    'ui-scroll-grid': '../src/ui-scroll-grid.js'
  },
  output: {
    path: path.join(__dirname, '../temp'),
    filename: '[name].js'
  },
  // cache: false,
  // devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader?presets[]=es2015'
    }]
  },
  resolve: {
    extensions: ['.js'],
    modules: [
      __dirname,
      path.resolve(__dirname, '../node_modules')
    ]
  }
};

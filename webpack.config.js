var path = require('path');
module.exports = {
  entry: {
    'ui-scroll': './src/ui-scroll.js',
    'ui-scroll-grid': './src/ui-scroll-grid.js',
    'ui-scroll-jqlite': './src/ui-scroll-jqlite.js'
  },
  output: {
    path: path.join(__dirname, 'temp'),
    filename: '[name].js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};

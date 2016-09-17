var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './src/app.js',
  output: {
    path: __dirname,
    filename: './build/index.js'
  },
  resolve: {
    root: [path.join(__dirname, 'bower_components')]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    )
  ],
  module: {
    loaders: [
      {
        test: /\.less$/,
        loader: 'style!css!less'
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          'presets': ['es2015']
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue'
      }
    ]
  },
  babel: {
    presets: ['es2015']
  },
  devtool: 'inline-source-map'
};

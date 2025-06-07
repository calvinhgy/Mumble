const path = require('path');

module.exports = {
  mode: 'production',
  entry: './functions',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  externals: {
    'aws-sdk': 'aws-sdk'
  },
  optimization: {
    minimize: false
  }
};

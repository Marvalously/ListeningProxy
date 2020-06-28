const path = require('path');

module.exports = {
  entry: './src/ListeningProxy.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'ListeningProxy.min.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
          }
        }
      }
    ],
  },
};
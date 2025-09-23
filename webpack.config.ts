import path from 'path';

export default {
  entry: './src/index.ts',
  target: 'node',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.worker\.ts$/,
        use: { loader: 'worker-loader', options: { inline: 'no-fallback' } },
      },
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
};

import path from 'path';

export default {
  entry: './src/index.ts',
  target: 'node',
  output: {
    filename: '[name].js', // main bundle name = entry name
    chunkFilename: '[name].chunk.js', // dynamically imported chunks
    path: path.resolve(process.cwd(), './dist'),
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
    ],
  },
  experiments: {
    topLevelAwait: true,
  },
};

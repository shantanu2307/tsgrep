import path from 'path';

export default {
  entry: './src/index.ts',
  target: 'node',
  output: {
    filename: 'index.js',
    // eslint-disable-next-line no-undef
    path: path.resolve(process.cwd(), './dist'),
    clean: true,
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
    topLevelAwait: true,
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
};

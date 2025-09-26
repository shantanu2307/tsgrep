import path from 'path';
import webpack from 'webpack';

export default {
  entry: {
    index: './src/index.ts',
    'scan.worker': './src/scan.worker.ts',
  },
  target: 'node',
  output: {
    filename: '[name].js',
    // eslint-disable-next-line no-undef
    path: path.resolve(process.cwd(), './dist'),
    clean: true,
    library: {
      type: 'commonjs2',
    },
  },
  experiments: {
    outputModule: false,
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
      {
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.TEST': JSON.stringify(false),
    }),
  ],
};

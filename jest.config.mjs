/** @type {import('jest').Config} */
const env = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
};

export default env;

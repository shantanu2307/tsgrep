// utils
import { ensureDir, rimrafDir } from '../../src/fileUtils';
import { testRunner } from './testRunner';
import { cleanup } from '../../dist';

// constants
import { FIXTURES_DIR, STRESS_DIR } from '../../src/constants';
import { TEST_CASES } from './testCases';

describe('Search Stress Tests', () => {
  jest.setTimeout(600000);

  beforeAll(() => ensureDir(FIXTURES_DIR));
  beforeEach(() => ensureDir(STRESS_DIR));
  afterEach(() => rimrafDir(STRESS_DIR));
  afterAll(() => {
    rimrafDir(FIXTURES_DIR);
    cleanup();
  });

  TEST_CASES.forEach(tc => {
    const runner = tc.skip ? it.skip : it;
    runner(tc.name, async () => {
      await testRunner(tc);
    });
  });
});

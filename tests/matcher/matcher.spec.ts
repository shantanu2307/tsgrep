// utils
import { testRunner } from './testRunner';

// constants
import { TEST_CASES } from './testCases';

describe('scanForMatches', () => {
  TEST_CASES.forEach(tc => {
    it(tc.name, async () => {
      await testRunner(tc);
    });
  });
});

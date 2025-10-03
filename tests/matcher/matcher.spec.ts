// utils
import { runMatcherTestCase } from './testRunner';

// constantss
import { TEST_CASES } from './testCases';

describe('scanForMatches', () => {
  TEST_CASES.forEach(tc => {
    it(tc.name, async () => {
      await runMatcherTestCase(tc);
    });
  });
});

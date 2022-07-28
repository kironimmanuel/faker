import { afterEach, describe, expect, it } from 'vitest';
import { faker, FakerError } from '../src';
import type { StringModule } from '../src/modules/string';
import { seededRuns } from './support/seededRuns';
import { times } from './support/times';

const NON_SEEDED_BASED_RUN = 5;

const functionNames: (keyof StringModule)[] = [
  'uuid',
  'hexadecimal',
  'random',
  'alpha',
  'alphaNumeric',
  'numeric',
];

describe('string', () => {
  afterEach(() => {
    faker.locale = 'en';
  });

  for (const seed of seededRuns) {
    describe(`seed: ${seed}`, () => {
      for (const functionName of functionNames) {
        it(`${functionName}()`, () => {
          faker.seed(seed);

          const actual = faker.string[functionName]();

          expect(actual).toMatchSnapshot();
        });
      }

      describe('hexadecimal()', () => {
        it('should return a deterministic hex of given length', () => {
          faker.seed(seed);

          const actual = faker.string.hexadecimal(42);
          expect(actual).toMatchSnapshot();
        });
      });
    });

    describe('random()', () => {
      it('should return a deterministic string of given length', () => {
        faker.seed(seed);

        const actual = faker.string.random(42);
        expect(actual).toMatchSnapshot();
      });
    });
  }

  // Create and log-back the seed for debug purposes
  faker.seed(Math.ceil(Math.random() * 1_000_000_000));

  describe(`random seeded tests for seed ${JSON.stringify(
    faker.seed()
  )}`, () => {
    for (let i = 1; i <= NON_SEEDED_BASED_RUN; i++) {
      describe('random()', () => {
        it('should generate a string value', () => {
          const generatedString = faker.string.random();
          expect(generatedString).toBeTypeOf('string');
          expect(generatedString).toHaveLength(10);
        });

        it('should return empty string if negative length is passed', () => {
          const negativeValue = faker.datatype.number({ min: -1000, max: -1 });
          const generatedString = faker.string.random(negativeValue);
          expect(generatedString).toBe('');
          expect(generatedString).toHaveLength(0);
        });

        it('should return string with length of 2^20 if bigger length value is passed', () => {
          const overMaxValue = Math.pow(2, 28);
          const generatedString = faker.string.random(overMaxValue);
          expect(generatedString).toHaveLength(Math.pow(2, 20));
        });

        it('should return string with a specific length', () => {
          const length = 1337;
          const generatedString = faker.string.random(length);
          expect(generatedString).toHaveLength(length);
        });
      });

      describe(`uuid()`, () => {
        it('generates a valid UUID', () => {
          const UUID = faker.string.uuid();
          const RFC4122 =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
          expect(UUID).toMatch(RFC4122);
        });
      });

      describe(`hexadecimal()`, () => {
        it('generates single hex character when no additional argument was provided', () => {
          const hex = faker.string.hexadecimal();
          expect(hex).toMatch(/^[0-9a-f]*$/i);
          expect(hex).toHaveLength(1);
        });

        it('generates a random hex string', () => {
          const hex = faker.string.hexadecimal(5);
          expect(hex).toMatch(/^[0-9a-f]*$/i);
          expect(hex).toHaveLength(5);
        });
      });

      describe('alpha()', () => {
        it('should return single letter when no count provided', () => {
          const actual = faker.string.alpha();

          expect(actual).toHaveLength(1);
        });

        it('should return any letters when no option is provided', () => {
          const actual = faker.string.alpha();

          expect(actual).toMatch(/^[a-zA-Z]$/);
        });

        it.each([
          ['upper', /^[A-Z]{250}$/],
          ['lower', /^[a-z]{250}$/],
          ['mixed', /^[a-zA-Z]{250}$/],
        ] as const)('should return %s-case', (casing, pattern) => {
          const actual = faker.string.alpha({ count: 250, casing });
          expect(actual).toMatch(pattern);
        });

        it('should generate many random letters', () => {
          const actual = faker.string.alpha(5);

          expect(actual).toHaveLength(5);
        });

        it.each([0, -1, -100])(
          'should return empty string when length is <= 0',
          (length) => {
            const actual = faker.string.alpha(length);

            expect(actual).toBe('');
          }
        );

        it('should be able to ban some characters', () => {
          const actual = faker.string.alpha({
            count: 5,
            bannedChars: ['a', 'p'],
            casing: 'lower',
          });

          expect(actual).toHaveLength(5);
          expect(actual).toMatch(/^[b-oq-z]{5}$/);
        });

        it('should be able to ban some characters via string', () => {
          const actual = faker.string.alpha({
            count: 5,
            bannedChars: 'ap',
            casing: 'lower',
          });

          expect(actual).toHaveLength(5);
          expect(actual).toMatch(/^[b-oq-z]{5}$/);
        });

        it('should be able handle mistake in banned characters array', () => {
          const alphaText = faker.string.alpha({
            count: 5,
            bannedChars: ['a', 'a', 'p'],
            casing: 'lower',
          });

          expect(alphaText).toHaveLength(5);
          expect(alphaText).toMatch(/^[b-oq-z]{5}$/);
        });

        it('should throw if all possible characters being banned', () => {
          const bannedChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
          expect(() =>
            faker.string.alpha({
              count: 5,
              bannedChars,
              casing: 'lower',
            })
          ).toThrowError(
            new FakerError(
              'Unable to generate string, because all possible characters are banned.'
            )
          );
        });

        it('should not mutate the input object', () => {
          const input: {
            count: number;
            casing: 'mixed';
            bannedChars: string[];
          } = Object.freeze({
            count: 5,
            casing: 'mixed',
            bannedChars: ['a', '%'],
          });

          expect(() => faker.string.alpha(input)).not.toThrow();
          expect(input.bannedChars).toEqual(['a', '%']);
        });
      });

      describe('alphaNumeric', () => {
        it('should generate single character when no additional argument was provided', () => {
          const actual = faker.string.alphaNumeric();

          expect(actual).toHaveLength(1);
        });

        it.each([
          ['upper', /^[A-Z0-9]{250}$/],
          ['lower', /^[a-z0-9]{250}$/],
          ['mixed', /^[a-zA-Z0-9]{250}$/],
        ] as const)('should return %s-case', (casing, pattern) => {
          const actual = faker.string.alphaNumeric({ count: 250, casing });
          expect(actual).toMatch(pattern);
        });

        it('should generate many random characters', () => {
          const actual = faker.string.alphaNumeric(5);

          expect(actual).toHaveLength(5);
        });

        it.each([0, -1, -100])(
          'should return empty string when length is <= 0',
          (length) => {
            const actual = faker.string.alphaNumeric(length);

            expect(actual).toBe('');
          }
        );

        it('should be able to ban all alphabetic characters', () => {
          const bannedChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
          const alphaText = faker.string.alphaNumeric({
            count: 5,
            bannedChars,
            casing: 'lower',
          });

          expect(alphaText).toHaveLength(5);
          for (const bannedChar of bannedChars) {
            expect(alphaText).not.includes(bannedChar);
          }
        });

        it('should be able to ban all alphabetic characters via string', () => {
          const bannedChars = 'abcdefghijklmnopqrstuvwxyz';
          const alphaText = faker.string.alphaNumeric({
            count: 5,
            bannedChars,
            casing: 'lower',
          });

          expect(alphaText).toHaveLength(5);
          for (const bannedChar of bannedChars) {
            expect(alphaText).not.includes(bannedChar);
          }
        });

        it('should be able to ban all numeric characters', () => {
          const bannedChars = '0123456789'.split('');
          const alphaText = faker.string.alphaNumeric({
            count: 5,
            bannedChars,
          });

          expect(alphaText).toHaveLength(5);
          for (const bannedChar of bannedChars) {
            expect(alphaText).not.includes(bannedChar);
          }
        });

        it('should be able to ban all numeric characters via string', () => {
          const bannedChars = '0123456789';
          const alphaText = faker.string.alphaNumeric({
            count: 5,
            bannedChars,
          });

          expect(alphaText).toHaveLength(5);
          for (const bannedChar of bannedChars) {
            expect(alphaText).not.includes(bannedChar);
          }
        });

        it('should be able to handle mistake in banned characters array', () => {
          const alphaText = faker.string.alphaNumeric({
            count: 5,
            bannedChars: ['a', 'p', 'a'],
            casing: 'lower',
          });

          expect(alphaText).toHaveLength(5);
          expect(alphaText).toMatch(/^[0-9b-oq-z]{5}$/);
        });

        it('should throw if all possible characters being banned', () => {
          const bannedChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
          expect(() =>
            faker.string.alphaNumeric({
              count: 5,
              bannedChars,
              casing: 'lower',
            })
          ).toThrowError(
            new FakerError(
              'Unable to generate string, because all possible characters are banned.'
            )
          );
        });

        it('should throw if all possible characters being banned via string', () => {
          const bannedChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
          expect(() =>
            faker.string.alphaNumeric({
              count: 5,
              bannedChars,
              casing: 'lower',
            })
          ).toThrowError();
        });

        it('should not mutate the input object', () => {
          const input: {
            bannedChars: string[];
            count: number;
          } = Object.freeze({
            bannedChars: ['a', '0', '%'],
            count: 5,
          });

          expect(() => faker.string.alphaNumeric(input)).not.toThrow();
          expect(input.bannedChars).toEqual(['a', '0', '%']);
        });
      });

      describe('numeric', () => {
        it('should return single digit when no length provided', () => {
          const actual = faker.string.numeric();

          expect(actual).toHaveLength(1);
          expect(actual).toMatch(/^[1-9]$/);
        });

        it.each(times(100))(
          'should generate random value with a length of %s',
          (length) => {
            const actual = faker.string.numeric(length);

            expect(actual).toHaveLength(length);
            expect(actual).toMatch(/^[1-9][0-9]*$/);
          }
        );

        it('should return empty string with a length of 0', () => {
          const actual = faker.string.numeric(0);

          expect(actual).toHaveLength(0);
        });

        it('should return empty string with a negative length', () => {
          const actual = faker.string.numeric(-10);

          expect(actual).toHaveLength(0);
        });

        it('should return a valid numeric string with provided length', () => {
          const actual = faker.string.numeric(1000);

          expect(actual).toBeTypeOf('string');
          expect(actual).toHaveLength(1000);
          expect(actual).toMatch(/^[1-9][0-9]+$/);
        });

        it('should allow leading zeros via option', () => {
          const actual = faker.string.numeric({
            length: 15,
            allowLeadingZeros: true,
          });

          expect(actual).toMatch(/^[0-9]+$/);
        });

        it('should allow leading zeros via option and all other digits banned', () => {
          const actual = faker.string.numeric({
            length: 4,
            allowLeadingZeros: true,
            bannedDigits: '123456789'.split(''),
          });

          expect(actual).toBe('0000');
        });

        it('should allow leading zeros via option and all other digits banned via string', () => {
          const actual = faker.string.numeric({
            length: 4,
            allowLeadingZeros: true,
            bannedDigits: '123456789',
          });

          expect(actual).toBe('0000');
        });

        it('should fail on leading zeros via option and all other digits banned', () => {
          expect(() =>
            faker.string.numeric({
              length: 4,
              allowLeadingZeros: false,
              bannedDigits: '123456789'.split(''),
            })
          ).toThrowError(
            new FakerError(
              'Unable to generate numeric string, because all possible digits are banned.'
            )
          );
        });

        it('should fail on leading zeros via option and all other digits banned via string', () => {
          expect(() =>
            faker.string.numeric({
              length: 4,
              allowLeadingZeros: false,
              bannedDigits: '123456789',
            })
          ).toThrowError(
            new FakerError(
              'Unable to generate numeric string, because all possible digits are banned.'
            )
          );
        });

        it('should ban all digits passed via bannedDigits', () => {
          const actual = faker.string.numeric({
            length: 1000,
            bannedDigits: 'c84U1'.split(''),
          });

          expect(actual).toHaveLength(1000);
          expect(actual).toMatch(/^[0235679]{1000}$/);
        });

        it('should ban all digits passed via bannedDigits via string', () => {
          const actual = faker.string.numeric({
            length: 1000,
            bannedDigits: 'c84U1',
          });

          expect(actual).toHaveLength(1000);
          expect(actual).toMatch(/^[0235679]{1000}$/);
        });
      });
    }
  });
});

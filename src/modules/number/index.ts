import type { Faker } from '../..';
import { FakerError } from '../../errors/faker-error';

export type Range = {
  /**
   * Lower bound for generated number. Defaults to `0`.
   */
  min?: number;

  /**
   * Upper bound for generated number. Defaults to `min + 99999`.
   */
  max?: number;
};

/**
 * Module to generate numbers of any kind.
 */
export class NumberModule {
  constructor(private readonly faker: Faker) {
    // Bind `this` so namespaced is working correctly
    for (const name of Object.getOwnPropertyNames(NumberModule.prototype)) {
      if (name === 'constructor' || typeof this[name] !== 'function') {
        continue;
      }
      this[name] = this[name].bind(this);
    }
  }

  /**
   * Returns a single random integer between zero and the given max value or the given range.
   * The bounds are inclusive.
   *
   * @param options Maximum value or options object.
   * @param options.min Lower bound for generated number. Defaults to `0`.
   * @param options.max Upper bound for generated number. Defaults to `min + 99999`.
   *
   * @throws When options define `max < min`.
   *
   * @example
   * faker.number.int() // 55422
   * faker.number.int(100) // 52
   * faker.number.int({ min: 1000000 }) // 1031433
   * faker.number.int({ max: 100 }) // 42
   */
  int(options: number | Range = {}): number {
    if (typeof options === 'number') {
      options = { max: options };
    }

    const { min = 0 } = options;
    const max = options.max ?? min + 99999;

    if (max === min) {
      return min;
    }

    if (max < min) {
      throw new FakerError(`Max ${max} should be greater than min ${min}.`);
    }

    const randomInt = this.faker.mersenne.rand(max + 1, min);

    return randomInt;
  }

  /**
   * Returns a single random floating-point number for the given precision or range and precision.
   *
   * @param options Precision or options object.
   * @param options.min Lower bound for generated number. Defaults to `0`.
   * @param options.max Upper bound for generated number. Defaults to `99999`.
   * @param options.precision Number of digits after the decimal point. Negative numbers will be treated as `0`. Defaults to `2`.
   *
   * @example
   * faker.number.float() // 51696.36
   * faker.number.float(1) // 52023.2
   * faker.number.float({ min: 1000000 }) // 212859.76
   * faker.number.float({ max: 100 }) // 28.11
   * faker.number.float({ precision: 1 }) // 84055.3
   * faker.number.float({ min: 10, max: 100, precision: 3 }) // 57.315
   */
  float(
    options: number | { min?: number; max?: number; precision?: number } = {}
  ): number {
    if (typeof options === 'number') {
      options = {
        precision: options,
      };
    }

    const { precision = 2 } = options;

    const int = this.int(options);
    if (precision <= 0) {
      return int;
    } else if (int === options.max) {
      return int;
    }

    const floatingPoint = this.int({
      min: 0,
      max: Math.pow(10, precision) - 1,
    });

    const float = parseFloat(
      `${int}.${floatingPoint.toString().padStart(precision, '0')}`
    );

    return float;
  }

  /**
   * Returns a [hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) number.
   *
   * @param length Length of the generated number. Defaults to `1`.
   *
   * @example
   * faker.datatype.hexadecimal() // 'b'
   * faker.datatype.hexadecimal(10) // 'ae13f044fb'
   */
  hexadecimal(length = 1): string {
    let hexString = '';

    for (let i = 0; i < length; i++) {
      hexString += this.faker.helpers.arrayElement([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
      ]);
    }

    return hexString;
  }

  /**
   * Returns a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type) number.
   *
   * @param options Maximum value or options object.
   * @param options.min Lower bound for generated bigint. Defaults to `0n`.
   * @param options.max Upper bound for generated bigint. Defaults to `min + 999999999999999n`.
   *
   * @throws When options define `max < min`.
   *
   * @example
   * faker.datatype.bigInt() // 55422n
   * faker.datatype.bigInt(100n) // 52n
   * faker.datatype.bigInt({ min: 1000000n }) // 431433n
   * faker.datatype.bigInt({ max: 100n }) // 42n
   * faker.datatype.bigInt({ min: 10n, max: 100n }) // 36n
   */
  bigInt(
    options?:
      | bigint
      | boolean
      | number
      | string
      | {
          min?: bigint | boolean | number | string;
          max?: bigint | boolean | number | string;
        }
  ): bigint {
    let min: bigint;
    let max: bigint;

    if (typeof options === 'object') {
      min = BigInt(options.min ?? 0);
      max = BigInt(options.max ?? min + BigInt(999999999999999));
    } else {
      min = BigInt(0);
      max = BigInt(options ?? 999999999999999);
    }

    if (max === min) {
      return min;
    }

    if (max < min) {
      throw new FakerError(`Max ${max} should be larger then min ${min}.`);
    }

    const delta = max - min;

    const offset =
      BigInt(
        this.faker.random.numeric(delta.toString(10).length, {
          allowLeadingZeros: true,
        })
      ) %
      (delta + BigInt(1));

    return min + offset;
  }
}

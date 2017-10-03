/// <reference types="mocha"/>
/// <reference types="node" />
import xs, { Stream } from '../../src/index';
import split from '../../src/extra/split';
import concat from '../../src/extra/concat';
import periodic from '../../src/extra/periodic';
import * as assert from 'assert';

console.warn = () => {};

describe('split (extra)', () => {
  it('should split a stream using a separator stream', (done: any) => {
    const source = periodic(50).take(10);
    const separator = concat(periodic(167).take(2), xs.never());
    const stream = source.compose(split(separator));
    const outerExpected = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8, 9]
    ];

    stream.addListener({
      next: (inner: Stream<number>) => {
        const innerExpected = outerExpected.shift();
        inner.addListener({
          next: (x: number) => {
            if (innerExpected) {
              assert.equal(x, innerExpected.shift());
            } else {
              assert.fail(undefined, innerExpected, 'e should be defined', '=');
            }
          },
          error: (err: any) => done(err),
          complete: () => {
            if (innerExpected) {
              assert.equal(innerExpected.length, 0);
            } else {
              assert.fail(undefined, innerExpected, 'e should be defined', '=');
            }
          }
        });
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(outerExpected.length, 0);
        done();
      },
    });
  });

  it('should be canceled out if flattened immediately after', (done: any) => {
    const source = periodic(50).take(10);
    const separator = concat(periodic(167).take(2), xs.never());
    const stream = source.compose(split(separator)).flatten();
    const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      }
    });
  });

  it('should complete when the separator completes', (done: any) => {
    const source = periodic(50).take(10);
    const separator = periodic(167).take(2);
    const stream = source.compose(split(separator)).flatten();
    const expected = [0, 1, 2, 3, 4, 5];

    stream.addListener({
      next: (x: number) => {
        assert.equal(x, expected.shift());
      },
      error: (err: any) => done(err),
      complete: () => {
        assert.equal(expected.length, 0);
        done();
      }
    });
  });
});

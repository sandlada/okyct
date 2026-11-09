/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function flow<A, B>(fn1: (x: A) => B): (x: A) => B
export function flow<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C
export function flow<A, B, C, D>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D): (x: A) => D
export function flow<A, B, C, D, E>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E): (x: A) => E
export function flow(...fns: Array<(x: any) => any>): (input: any) => any {
  return (input: any) => fns.reduce((acc, fn) => fn(acc), input)
}

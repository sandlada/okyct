
export function flow<A, B>(fn1: (x: A) => B): (x: A) => B
export function flow<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C
export function flow<A, B, C, D>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D): (x: A) => D
export function flow<A, B, C, D, E>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E): (x: A) => E
export function flow<A, B, C, D, E, F>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F): (x: A) => F
export function flow<A, B, C, D, E, F, G>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G): (x: A) => G
export function flow<A, B, C, D, E, F, G, H>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn7: (x: G) => H): (x: A) => H
export function flow<A, B, C, D, E, F, G, H, I>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E, fn5: (x: E) => F, fn6: (x: F) => G, fn7: (x: G) => H, fn8: (x: H) => I): (x: A) => I
export function flow(...fns: ReadonlyArray<(x: any) => any>): (input: unknown) => unknown {
  return (input: unknown) => fns.reduce((acc, fn) => fn(acc), input)
}

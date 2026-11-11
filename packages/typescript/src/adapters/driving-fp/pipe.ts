
export function pipe<T>(value: T): T
export function pipe<T, A>(value: T, fn1: (x: T) => A): A
export function pipe<T, A, B>(value: T, fn1: (x: T) => A, fn2: (x: A) => B): B
export function pipe<T, A, B, C>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C): C
export function pipe<T, A, B, C, D>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D): D
export function pipe<T, A, B, C, D, E>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E): E
export function pipe<T, A, B, C, D, E, F>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F): F
export function pipe<T, A, B, C, D, E, F, G>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G): G
export function pipe<T, A, B, C, D, E, F, G, H>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F, fn7: (x: F) => G, fn8: (x: G) => H): H
export function pipe(value: unknown, ...fns: ReadonlyArray<(x: any) => any>): unknown {
  return fns.reduce((acc, fn) => fn(acc), value)
}

/** Mirrors @sandlada/okyct adapters kebabCase for CSS variable names. */
export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

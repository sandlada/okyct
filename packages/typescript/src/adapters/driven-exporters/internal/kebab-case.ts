/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
}

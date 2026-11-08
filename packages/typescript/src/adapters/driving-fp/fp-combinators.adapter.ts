/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 4: Driving Adapter — Functional Programming Combinators]
 * 职责：面向开发者的 `func(args)(dataLast)` 柯里化管道驱动适配器
 */

import type { EmissivePanelType } from '../../ports/index.ts';
import {
  applyEmissiveProfileToTokenHex,
  applyBlueBurnInGuard,
  computeColorEmissiveTelemetry,
} from '../driven-emissive-oled/oled-physics.adapter.ts';

export function pipe<T>(value: T): T;
export function pipe<T, A>(value: T, fn1: (x: T) => A): A;
export function pipe<T, A, B>(value: T, fn1: (x: T) => A, fn2: (x: A) => B): B;
export function pipe<T, A, B, C>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C): C;
export function pipe<T, A, B, C, D>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D): D;
export function pipe<T, A, B, C, D, E>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E): E;
export function pipe<T, A, B, C, D, E, F>(value: T, fn1: (x: T) => A, fn2: (x: A) => B, fn3: (x: B) => C, fn4: (x: C) => D, fn5: (x: D) => E, fn6: (x: E) => F): F;
export function pipe(value: any, ...fns: Array<(x: any) => any>): any {
  return fns.reduce((acc, fn) => fn(acc), value);
}

export function flow<A, B>(fn1: (x: A) => B): (x: A) => B;
export function flow<A, B, C>(fn1: (x: A) => B, fn2: (x: B) => C): (x: A) => C;
export function flow<A, B, C, D>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D): (x: A) => D;
export function flow<A, B, C, D, E>(fn1: (x: A) => B, fn2: (x: B) => C, fn3: (x: C) => D, fn4: (x: D) => E): (x: A) => E;
export function flow(...fns: Array<(x: any) => any>): (input: any) => any {
  return (input: any) => fns.reduce((acc, fn) => fn(acc), input);
}

export type TokenDictionary = Record<string, string>;
export type NamingCase = 'kebab' | 'camel' | 'snake' | 'constant';

export const renameCase = (targetCase: NamingCase) =>
  (dict: TokenDictionary): TokenDictionary => {
    const toKebab = (s: string) => s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase().replace(/^-+/, '');
    const toCamel = (s: string) => s.replace(/[-_]([a-z0-9])/gi, (_, c) => c.toUpperCase());
    const toSnake = (s: string) => toKebab(s).replace(/-/g, '_');
    const toConstant = (s: string) => toSnake(s).toUpperCase();

    const transform = {
      kebab: toKebab,
      camel: toCamel,
      snake: toSnake,
      constant: toConstant,
    }[targetCase];

    const result: TokenDictionary = {};
    for (const [key, val] of Object.entries(dict)) {
      result[transform(key)] = val;
    }
    return result;
  };

export const mapTokens = (mapper: (val: string, key: string) => string) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {};
    for (const [k, v] of Object.entries(dict)) {
      result[k] = mapper(v, k);
    }
    return result;
  };

export const withPrefix = (prefix: string) =>
  (dict: TokenDictionary): TokenDictionary => {
    const cleanPrefix = prefix.endsWith('-') ? prefix : `${prefix}-`;
    const result: TokenDictionary = {};
    for (const [key, val] of Object.entries(dict)) {
      const cleanKey = key.startsWith('--') ? key.slice(2) : key;
      result[`${cleanPrefix}${cleanKey}`] = val;
    }
    return result;
  };

export const pickTokens = (keys: readonly string[]) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {};
    for (const k of keys) {
      if (k in dict) {
        result[k] = dict[k];
      }
    }
    return result;
  };

export const omitTokens = (keys: readonly string[]) =>
  (dict: TokenDictionary): TokenDictionary => {
    const keySet = new Set(keys);
    const result: TokenDictionary = {};
    for (const [k, v] of Object.entries(dict)) {
      if (!keySet.has(k)) {
        result[k] = v;
      }
    }
    return result;
  };

export const filterTokens = (predicate: (key: string, value: string) => boolean) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {};
    for (const [k, v] of Object.entries(dict)) {
      if (predicate(k, v)) {
        result[k] = v;
      }
    }
    return result;
  };

export const nestTokens = (delimiter = '-') =>
  (dict: TokenDictionary): Record<string, any> => {
    const root: Record<string, any> = {};
    for (const [key, val] of Object.entries(dict)) {
      const cleanKey = key.replace(/^--/, '');
      const parts = cleanKey.split(delimiter);
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = val;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    }
    return root;
  };

export const flattenTokens = (delimiter = '-') =>
  (tree: Record<string, any>): TokenDictionary => {
    const result: TokenDictionary = {};
    const recurse = (obj: Record<string, any>, currentPath: string[]) => {
      for (const [k, v] of Object.entries(obj)) {
        const newPath = [...currentPath, k];
        if (v && typeof v === 'object' && !Array.isArray(v) && !('$value' in v)) {
          recurse(v, newPath);
        } else {
          const leafVal = v && typeof v === 'object' && '$value' in v ? v.$value : String(v);
          result[newPath.join(delimiter)] = leafVal;
        }
      }
    };
    recurse(tree, []);
    return result;
  };

export const withAlpha = (opacity: number) =>
  (colorOrVar: string): string => {
    const alpha = Math.max(0, Math.min(1, opacity));
    const trimmed = colorOrVar.trim();

    if (trimmed.startsWith('var(') || trimmed.startsWith('--')) {
      const varExpr = trimmed.startsWith('--') ? `var(${trimmed})` : trimmed;
      const pct = Math.round(alpha * 100);
      return `color-mix(in srgb, ${varExpr} ${pct}%, transparent)`;
    }

    if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
      return `${trimmed}${alphaHex}`.toUpperCase();
    }

    return `color-mix(in srgb, ${trimmed} ${Math.round(alpha * 100)}%, transparent)`;
  };

export const toCssVarRef = (options: { prefix?: string; fallback?: string } = {}) =>
  (tokenKey: string): string => {
    const p = options.prefix ? (options.prefix.endsWith('-') ? options.prefix : `${options.prefix}-`) : '--';
    const cleanKey = tokenKey.replace(/^[-\s]+/, '');
    const varName = `${p}${cleanKey}`;
    return options.fallback ? `var(${varName}, ${options.fallback})` : `var(${varName})`;
  };

export const toCssRuleBlock = (selector: string) =>
  (dict: TokenDictionary): string => {
    const lines = Object.entries(dict).map(([k, v]) => {
      const keyName = k.startsWith('--') ? k : `--${k}`;
      return `  ${keyName}: ${v};`;
    });
    return `${selector} {\n${lines.join('\n')}\n}`;
  };

export interface ContractValidationReport {
  valid: boolean;
  missingKeys: string[];
  extraKeys: string[];
  totalChecked: number;
}

export const validateContract = (requiredKeys: readonly string[]) =>
  (dict: TokenDictionary): ContractValidationReport => {
    const dictKeys = new Set(Object.keys(dict).map(k => k.replace(/^--/, '')));
    const reqSet = new Set(requiredKeys);

    const missingKeys = requiredKeys.filter(k => !dictKeys.has(k));
    const extraKeys = Array.from(dictKeys).filter(k => !reqSet.has(k));

    return {
      valid: missingKeys.length === 0,
      missingKeys,
      extraKeys,
      totalChecked: requiredKeys.length,
    };
  };

export const diffThemeParity = (referenceDict: TokenDictionary) =>
  (targetDict: TokenDictionary): { isSymmetric: boolean; asymmetryKeys: string[] } => {
    const refKeys = new Set(Object.keys(referenceDict));
    const targetKeys = new Set(Object.keys(targetDict));

    const asymmetryKeys: string[] = [];
    for (const k of refKeys) {
      if (!targetKeys.has(k)) asymmetryKeys.push(`Target missing: ${k}`);
    }
    for (const k of targetKeys) {
      if (!refKeys.has(k)) asymmetryKeys.push(`Reference missing: ${k}`);
    }

    return {
      isSymmetric: asymmetryKeys.length === 0,
      asymmetryKeys,
    };
  };

export const optimizeForOled = (options: {
  profile: EmissivePanelType;
  burnInGuard?: boolean;
  antiFringing?: boolean;
}) =>
  (dict: TokenDictionary): TokenDictionary => {
    const result: TokenDictionary = {};
    for (const [k, v] of Object.entries(dict)) {
      result[k] = applyEmissiveProfileToTokenHex(k, v, options);
    }
    return result;
  };

export const limitBlueEmission = (
  options: { maxBlueAttenuation?: number; hueShiftDeg?: number } = {}
) =>
  (colorHex: string): string => {
    return applyBlueBurnInGuard(colorHex, options);
  };

export interface OledPowerAuditReport {
  passed: boolean;
  averagePowerMw: number;
  averageAplPercent: number;
  maxBlueStressToken: string;
  maxBlueStressIndex: number;
  trueBlackTokenCount: number;
  totalTokensEvaluated: number;
}

export const auditOledPower = (
  options: { maxAvgPowerMw?: number; maxBlueStress?: number } = {}
) =>
  (dict: TokenDictionary): OledPowerAuditReport => {
    const maxPowerThreshold = options.maxAvgPowerMw ?? 320;
    const maxBlueThreshold = options.maxBlueStress ?? 65;

    const entries = Object.entries(dict).filter(([, v]) => /^#([0-9a-f]{6})$/i.test(v.trim()));
    if (entries.length === 0) {
      return {
        passed: true,
        averagePowerMw: 0,
        averageAplPercent: 0,
        maxBlueStressToken: 'none',
        maxBlueStressIndex: 0,
        trueBlackTokenCount: 0,
        totalTokensEvaluated: 0,
      };
    }

    let sumPower = 0;
    let sumApl = 0;
    let maxBlue = -1;
    let maxBlueKey = entries[0][0];
    let trueBlackCount = 0;

    for (const [k, hex] of entries) {
      const t = computeColorEmissiveTelemetry(hex);
      sumPower += t.powerMw;
      sumApl += t.aplPercent;
      if (t.isPixelOff) trueBlackCount++;
      if (t.blueStressIndex > maxBlue) {
        maxBlue = t.blueStressIndex;
        maxBlueKey = k;
      }
    }

    const avgPower = Math.round((sumPower / entries.length) * 10) / 10;
    const avgApl = Math.round((sumApl / entries.length) * 10) / 10;

    return {
      passed: avgPower <= maxPowerThreshold && maxBlue <= maxBlueThreshold,
      averagePowerMw: avgPower,
      averageAplPercent: avgApl,
      maxBlueStressToken: maxBlueKey,
      maxBlueStressIndex: maxBlue,
      trueBlackTokenCount: trueBlackCount,
      totalTokensEvaluated: entries.length,
    };
  };

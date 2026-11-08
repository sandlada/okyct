/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 2: Ports (Inbound & Outbound Contracts) Barrel]
 * 职责：严格划分 inbound（驱动端口）与 outbound（被驱动端口），一个口对应一个文件
 */

export * from './inbound/index.ts';
export * from './outbound/index.ts';

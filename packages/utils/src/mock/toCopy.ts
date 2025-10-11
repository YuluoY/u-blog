import { toValue } from "@/core";
import { faker } from "@faker-js/faker";

/**
 * 复制对象
 * @param target 对象
 * @param param1 { min: number, max: number }
 * @returns 对象数组
 * @example
 * toCopy(createUser(), { min: 1, max: 5 })
 */
export const toCopy = <T = any>(target: T | (() => T), { min = 1, max = 5 } = {}): T[] => Array.from({ length: faker.number.int({ min, max }) }).map(() => toValue<T>(target))
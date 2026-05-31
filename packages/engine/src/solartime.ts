import type { BirthInput } from "./types.js";
import { WUXING } from "./shishen.js";
import { isTiangan } from "@numerology/knowledge";

/** 中国标准时所用经线(东经 120°)。 */
const STANDARD_MERIDIAN = 120;

export interface SolarTimeCorrection {
  /** 是否已做真太阳时校正(提供了经度才会做) */
  applied: boolean;
  longitude?: number;
  /** 总偏移(分钟,= 经度差 + 均时差) */
  offsetMinutes?: number;
  /** 经度差带来的偏移(分钟) */
  longitudeMinutes?: number;
  /** 均时差(分钟) */
  equationOfTimeMinutes?: number;
}

export interface ResolvedDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  correction: SolarTimeCorrection;
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 一年中的第 N 天(1-366)。 */
function dayOfYear(y: number, m: number, d: number): number {
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let n = cum[m - 1]! + d;
  if (m > 2 && isLeap(y)) n += 1;
  return n;
}

/** 均时差(分钟):真太阳时 − 平太阳时。标准近似公式。 */
function equationOfTime(n: number): number {
  const b = ((2 * Math.PI) / 364) * (n - 81);
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * 把出生时钟时间换算为【真太阳时】(提供经度时)。
 * 真太阳时 = 时钟时间 + (经度 − 120)×4 分钟 + 均时差。
 * 用 UTC 做加减以避免本地时区干扰,确定性。
 */
export function resolveBirthDateTime(input: BirthInput): ResolvedDateTime {
  const minute = input.minute ?? 0;
  const base = {
    year: input.year, month: input.month, day: input.day, hour: input.hour, minute,
  };
  if (input.longitude === undefined || input.longitude === null) {
    return { ...base, correction: { applied: false } };
  }

  const n = dayOfYear(input.year, input.month, input.day);
  const lonMinutes = (input.longitude - STANDARD_MERIDIAN) * 4;
  const eot = equationOfTime(n);
  const offset = Math.round(lonMinutes + eot);

  const ms = Date.UTC(input.year, input.month - 1, input.day, input.hour, minute) + offset * 60000;
  const dt = new Date(ms);

  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    hour: dt.getUTCHours(),
    minute: dt.getUTCMinutes(),
    correction: {
      applied: true,
      longitude: input.longitude,
      offsetMinutes: offset,
      longitudeMinutes: Math.round(lonMinutes),
      equationOfTimeMinutes: Math.round(eot),
    },
  };
}

/** 五行 → 方位 / 颜色 / 季节(开运参考)。 */
const WUXING_DIR: Record<string, { direction: string; color: string }> = {
  木: { direction: "东方", color: "青、绿" },
  火: { direction: "南方", color: "红、紫" },
  土: { direction: "中部 / 本地", color: "黄、棕" },
  金: { direction: "西方", color: "白、金" },
  水: { direction: "北方", color: "黑、蓝" },
};

export interface FavorableDirection {
  wuxing: string;
  gans: string[];
  direction: string;
  color: string;
}

/** 由喜用神(天干)推出有利的五行 → 方位 / 颜色。去重合并。 */
export function favorableDirections(useGods: string[]): FavorableDirection[] {
  const byWuXing = new Map<string, string[]>();
  for (const g of useGods) {
    if (!isTiangan(g)) continue;
    const wx = WUXING[g];
    if (!byWuXing.has(wx)) byWuXing.set(wx, []);
    byWuXing.get(wx)!.push(g);
  }
  return [...byWuXing.entries()].map(([wuxing, gans]) => ({
    wuxing,
    gans,
    direction: WUXING_DIR[wuxing]?.direction ?? "",
    color: WUXING_DIR[wuxing]?.color ?? "",
  }));
}

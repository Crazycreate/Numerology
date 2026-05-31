import { DIZHI, isDizhi, isTiangan, type Dizhi, type Tiangan } from "@numerology/knowledge";

/** 十二长生阶段(顺序固定)。 */
export const CHANGSHENG_STAGES = [
  "长生", "沐浴", "冠带", "临官", "帝旺", "衰",
  "病", "死", "墓", "绝", "胎", "养",
] as const;
export type ChangSheng = (typeof CHANGSHENG_STAGES)[number];

/** 各天干「长生」所在地支 + 顺逆(阳干顺行、阴干逆行)。 */
const QI: Record<Tiangan, { branch: Dizhi; forward: boolean }> = {
  甲: { branch: "亥", forward: true },
  丙: { branch: "寅", forward: true },
  戊: { branch: "寅", forward: true },
  庚: { branch: "巳", forward: true },
  壬: { branch: "申", forward: true },
  乙: { branch: "午", forward: false },
  丁: { branch: "酉", forward: false },
  己: { branch: "酉", forward: false },
  辛: { branch: "子", forward: false },
  癸: { branch: "卯", forward: false },
};

const branchIndex = (zhi: Dizhi): number => DIZHI.indexOf(zhi);

/**
 * 求某天干在某地支的十二长生阶段。确定性。
 * 用于「星运」(日主 vs 各柱地支)与「自坐」(各柱天干 vs 自身地支)。
 * @example changSheng("庚", "戌") => "衰"
 */
export function changSheng(gan: Tiangan, zhi: Dizhi): ChangSheng {
  const { branch, forward } = QI[gan];
  const qi = branchIndex(branch);
  const target = branchIndex(zhi);
  const step = forward ? (target - qi + 12) % 12 : (qi - target + 12) % 12;
  return CHANGSHENG_STAGES[step]!;
}

/** 安全版:非法干支返回 undefined。 */
export function changShengOf(gan: string, zhi: string): ChangSheng | undefined {
  if (!isTiangan(gan) || !isDizhi(zhi)) return undefined;
  return changSheng(gan, zhi);
}

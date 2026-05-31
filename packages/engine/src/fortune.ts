import { Solar } from "lunar-javascript";
import { astro } from "iztro";
import { isTiangan, type Tiangan } from "@numerology/knowledge";
import type { BirthInput } from "./types.js";
import { castBazi } from "./bazi.js";
import { hourToTimeIndex, validateBirthInput } from "./time.js";
import { dizhiHideGan, shiShen, type ShiShen } from "./shishen.js";
import { resolveBirthDateTime } from "./solartime.js";

export interface DaYunAnalysis {
  ganZhi: string;
  gan: string;
  zhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  /** 大运天干十神(相对日主) */
  ganShiShen: ShiShen;
  /** 大运地支藏干及其十神 */
  hideShiShen: { gan: string; shiShen: ShiShen }[];
  /** 是否引动调候/喜用神(天干或藏干命中用神)→ 补救信号 */
  suppliesUseGod: boolean;
  /** referenceYear 是否落在此运 */
  isCurrent: boolean;
}

export interface LiuNianAnalysis {
  year: number;
  age: number;
  ganZhi: string;
  ganShiShen: ShiShen;
  suppliesUseGod: boolean;
  isReference: boolean;
  /** 该流年是否已过(早于参考年)→ 供"回看验证" */
  isPast: boolean;
}

export type SihuaType = "禄" | "权" | "科" | "忌";

export interface Sihua {
  type: SihuaType;
  star: string;
  /** 该化星所在的本命宫位名(即"化X飞入本命某宫") */
  intoPalace: string;
}

export interface ZiweiScopeFortune {
  scope: "大限" | "流年";
  year?: number;
  heavenlyStem: string;
  earthlyBranch: string;
  /** 该运/年命宫落在本命哪个宫位名 */
  palaceName: string;
  sihua: Sihua[];
}

export interface FortuneAnalysis {
  referenceYear: number;
  bazi: {
    dayMaster: Tiangan;
    useGods: Tiangan[];
    useGodsReviewed: boolean;
    daYun: DaYunAnalysis[];
    liuNian: LiuNianAnalysis[];
  };
  ziwei: {
    decadal: ZiweiScopeFortune;
    yearly: ZiweiScopeFortune[];
  };
}

const SIHUA_ORDER: SihuaType[] = ["禄", "权", "科", "忌"];

/**
 * 动态运势分析:把"静"的命盘和"动"的大运流年结合。
 * - 八字:每步大运/窗口内流年的十神 + 是否引动喜用神(补救/受困信号)
 * - 紫微:大限 / 流年四化飞入本命哪个宫
 *
 * @param opts.referenceYear 参考年(默认当前年);用于标记"当前所处运/年"。
 * @param opts.yearsAhead    向后展开的流年数(默认 8)。
 * @param opts.yearsBack     向前回看的流年数(默认 0;>0 时纳入已过年份供"回看验证")。
 */
export function analyzeFortune(
  input: BirthInput,
  opts: { referenceYear?: number; yearsAhead?: number; yearsBack?: number } = {},
): FortuneAnalysis {
  validateBirthInput(input);
  const referenceYear = opts.referenceYear ?? new Date().getFullYear();
  const yearsAhead = opts.yearsAhead ?? 8;
  const yearsBack = opts.yearsBack ?? 0;
  const windowEnd = referenceYear + yearsAhead;
  const windowStart = referenceYear - yearsBack;

  const t = resolveBirthDateTime(input);
  const bazi = castBazi(input);
  const dayMaster = bazi.dayMaster;
  const useGods = new Set<string>(bazi.tiaohou.useGods);
  const suppliesUseGod = (gan: string, hide: Tiangan[]): boolean =>
    useGods.has(gan) || hide.some((g) => useGods.has(g));

  // —— 八字大运 ——
  const ec = Solar.fromYmdHms(
    t.year, t.month, t.day, t.hour, t.minute, 0,
  ).getLunar().getEightChar();
  const rawDaYun = ec.getYun(input.gender === "男" ? 1 : 0).getDaYun();

  const daYun: DaYunAnalysis[] = [];
  const liuNian: LiuNianAnalysis[] = [];

  for (const d of rawDaYun) {
    const ganZhi = d.getGanZhi();
    if (ganZhi.trim().length !== 2) continue; // 跳过起运前虚运
    const gan = ganZhi[0]!;
    const zhi = ganZhi[1]!;
    const hide = dizhiHideGan(zhi);
    const startYear = d.getStartYear();
    const endYear = startYear + 9;
    if (!isTiangan(gan)) continue;

    daYun.push({
      ganZhi, gan, zhi,
      startAge: d.getStartAge(),
      endAge: d.getEndAge(),
      startYear,
      endYear,
      ganShiShen: shiShen(dayMaster, gan),
      hideShiShen: hide.map((g) => ({ gan: g, shiShen: shiShen(dayMaster, g) })),
      suppliesUseGod: suppliesUseGod(gan, hide),
      isCurrent: referenceYear >= startYear && referenceYear <= endYear,
    });

    // 该运内、落在窗口的流年
    for (const y of d.getLiuNian()) {
      const year = y.getYear();
      if (year < windowStart || year > windowEnd) continue;
      const yGanZhi = y.getGanZhi();
      const yGan = yGanZhi[0]!;
      const yHide = dizhiHideGan(yGanZhi[1]!);
      if (!isTiangan(yGan)) continue;
      liuNian.push({
        year,
        age: y.getAge(),
        ganZhi: yGanZhi,
        ganShiShen: shiShen(dayMaster, yGan),
        suppliesUseGod: suppliesUseGod(yGan, yHide),
        isReference: year === referenceYear,
        isPast: year < referenceYear,
      });
    }
  }

  // —— 紫微大限 / 流年四化 ——
  const a = astro.bySolar(
    `${t.year}-${t.month}-${t.day}`,
    hourToTimeIndex(t.hour),
    input.gender,
    true,
    "zh-CN",
  );
  const starToPalace = buildStarToPalace(a.palaces);
  const palaceNameByIndex = new Map<number, string>(
    a.palaces.map((p) => [p.index, p.name]),
  );

  const toScope = (
    scope: "大限" | "流年",
    h: { heavenlyStem: string; earthlyBranch: string; mutagen: string[]; index: number },
    year?: number,
  ): ZiweiScopeFortune => ({
    scope,
    year,
    heavenlyStem: h.heavenlyStem,
    earthlyBranch: h.earthlyBranch,
    palaceName: palaceNameByIndex.get(h.index) ?? "未知",
    sihua: h.mutagen.map((star, i) => ({
      type: SIHUA_ORDER[i] ?? "禄",
      star,
      intoPalace: starToPalace.get(star) ?? "未入盘",
    })),
  });

  const decadalH = a.horoscope(`${referenceYear}-6-1`);
  const decadal = toScope("大限", decadalH.decadal);

  const yearly: ZiweiScopeFortune[] = [];
  for (let year = Math.max(windowStart, t.year); year <= windowEnd; year++) {
    const h = a.horoscope(`${year}-6-1`);
    yearly.push(toScope("流年", h.yearly, year));
  }

  return {
    referenceYear,
    bazi: {
      dayMaster,
      useGods: bazi.tiaohou.useGods,
      useGodsReviewed: bazi.tiaohou.reviewed,
      daYun,
      liuNian,
    },
    ziwei: { decadal, yearly },
  };
}

interface RawPalace {
  index: number;
  name: string;
  majorStars: { name: string }[];
  minorStars: { name: string }[];
  adjectiveStars: { name: string }[];
}

/** 建立"星曜名 → 本命宫位名"映射,用于判定四化飞入哪个宫。 */
function buildStarToPalace(palaces: RawPalace[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of palaces) {
    for (const s of [...p.majorStars, ...p.minorStars, ...p.adjectiveStars]) {
      if (!map.has(s.name)) map.set(s.name, p.name);
    }
  }
  return map;
}

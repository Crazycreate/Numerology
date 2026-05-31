import { createRequire } from "node:module";
import { castBazi } from "./bazi.js";
import { castZiwei } from "./ziwei.js";
import { validateBirthInput } from "./time.js";
import { resolveBirthDateTime } from "./solartime.js";
import type { ChartResult, BirthInput } from "./types.js";

export * from "./types.js";
export { castBazi } from "./bazi.js";
export { castZiwei, computeSanFangSiZheng } from "./ziwei.js";
export { hourToTimeIndex, validateBirthInput } from "./time.js";
export { shiShen, shiShenOf, dizhiHideGan, type ShiShen } from "./shishen.js";
export { changSheng, changShengOf, CHANGSHENG_STAGES, type ChangSheng } from "./changsheng.js";
export { shenShaForBranch, type ShenShaContext } from "./shensha.js";
export {
  resolveBirthDateTime,
  favorableDirections,
  type SolarTimeCorrection,
  type ResolvedDateTime,
  type FavorableDirection,
} from "./solartime.js";
export { analyzeFortune } from "./fortune.js";
export { castHourCandidates, type HourInferInput, type HourCandidate } from "./hourinfer.js";
export { solarFromLunar, type LunarDate, type SolarDate } from "./calendar.js";
export type {
  FortuneAnalysis,
  DaYunAnalysis,
  LiuNianAnalysis,
  ZiweiScopeFortune,
  Sihua,
  SihuaType,
} from "./fortune.js";

const require = createRequire(import.meta.url);

/**
 * 一次排出同一出生信息的【八字 + 紫微】双盘,返回标准命盘 JSON。
 * 这是引擎对外的主入口。纯确定性,无网络、无 AI。
 */
export function castChart(input: BirthInput): ChartResult {
  validateBirthInput(input);
  const { correction } = resolveBirthDateTime(input);
  return {
    input,
    meta: {
      trueSolarTimeApplied: correction.applied,
      correction,
      engine: {
        iztro: require("iztro/package.json").version,
        lunar: require("lunar-javascript/package.json").version,
      },
    },
    bazi: castBazi(input),
    ziwei: castZiwei(input),
  };
}

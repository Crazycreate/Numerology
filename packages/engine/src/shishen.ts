import { isTiangan, type Tiangan } from "@numerology/knowledge";

type WuXing = "木" | "火" | "土" | "金" | "水";

const WUXING: Record<Tiangan, WuXing> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

/** 阳=true,阴=false */
const IS_YANG: Record<Tiangan, boolean> = {
  甲: true, 乙: false, 丙: true, 丁: false, 戊: true,
  己: false, 庚: true, 辛: false, 壬: true, 癸: false,
};

/** 五行相生:键 生 值 */
const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
/** 五行相克:键 克 值 */
const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export type ShiShen =
  | "比肩" | "劫财" | "食神" | "伤官" | "偏财"
  | "正财" | "七杀" | "正官" | "偏印" | "正印";

/**
 * 计算某天干相对日主的十神。确定性,基于五行生克 + 阴阳同异。
 * @example shiShen("庚", "丁") => "正官"
 */
export function shiShen(dayGan: Tiangan, otherGan: Tiangan): ShiShen {
  const wd = WUXING[dayGan];
  const wo = WUXING[otherGan];
  const samePolarity = IS_YANG[dayGan] === IS_YANG[otherGan];

  if (wd === wo) return samePolarity ? "比肩" : "劫财";
  if (SHENG[wd] === wo) return samePolarity ? "食神" : "伤官"; // 我生
  if (SHENG[wo] === wd) return samePolarity ? "偏印" : "正印"; // 生我
  if (KE[wd] === wo) return samePolarity ? "偏财" : "正财"; // 我克
  return samePolarity ? "七杀" : "正官"; // 克我
}

/** 安全版:接受字符串,非法天干返回 undefined。 */
export function shiShenOf(dayGan: string, otherGan: string): ShiShen | undefined {
  if (!isTiangan(dayGan) || !isTiangan(otherGan)) return undefined;
  return shiShen(dayGan, otherGan);
}

/** 十二地支藏干(本气在前)。标准表,与 lunar-javascript 输出一致。 */
const HIDE_GAN: Record<string, Tiangan[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"],
  辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"], 午: ["丁", "己"], 未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"],
};

/** 取地支藏干。未知地支返回空数组。 */
export function dizhiHideGan(zhi: string): Tiangan[] {
  return HIDE_GAN[zhi] ? [...HIDE_GAN[zhi]] : [];
}

export { WUXING };

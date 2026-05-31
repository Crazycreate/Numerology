import type { Dizhi, Tiangan } from "@numerology/knowledge";

/**
 * 八字神煞(常用标准集,非穷尽)。
 * 说明:神煞流派众多、定义有差异;此处只实现规则较一致、争议较小的常用神煞,
 * 对定义分歧大的(福星/德秀/童子/血刃等)从略,避免臆造。
 */

/** 日干 → 触发该神煞的地支集合 */
type GanMap = Partial<Record<Tiangan, Dizhi[]>>;

const TIANYI: GanMap = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  壬: ["卯", "巳"], 癸: ["卯", "巳"],
  辛: ["寅", "午"],
};
const TAIJI: GanMap = {
  甲: ["子", "午"], 乙: ["子", "午"],
  丙: ["卯", "酉"], 丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"], 辛: ["寅", "亥"],
  壬: ["巳", "申"], 癸: ["巳", "申"],
};
const WENCHANG: GanMap = {
  甲: ["巳"], 乙: ["午"], 丙: ["申"], 戊: ["申"], 丁: ["酉"], 己: ["酉"],
  庚: ["亥"], 辛: ["子"], 壬: ["寅"], 癸: ["卯"],
};
const GUOYIN: GanMap = {
  甲: ["戌"], 乙: ["亥"], 丙: ["丑"], 丁: ["寅"], 戊: ["丑"], 己: ["寅"],
  庚: ["辰"], 辛: ["巳"], 壬: ["未"], 癸: ["申"],
};
const LUSHEN: GanMap = {
  甲: ["寅"], 乙: ["卯"], 丙: ["巳"], 戊: ["巳"], 丁: ["午"], 己: ["午"],
  庚: ["申"], 辛: ["酉"], 壬: ["亥"], 癸: ["子"],
};
const YANGREN: GanMap = {
  甲: ["卯"], 丙: ["午"], 戊: ["午"], 庚: ["酉"], 壬: ["子"],
};
const JINYU: GanMap = {
  甲: ["辰"], 乙: ["巳"], 丙: ["未"], 丁: ["申"], 戊: ["未"], 己: ["申"],
  庚: ["戌"], 辛: ["亥"], 壬: ["丑"], 癸: ["寅"],
};
const HONGYAN: GanMap = {
  甲: ["午"], 乙: ["午"], 丙: ["寅"], 丁: ["未"], 戊: ["辰"], 己: ["辰"],
  庚: ["戌"], 辛: ["酉"], 壬: ["子"], 癸: ["申"],
};

const GAN_SHENSHA: { name: string; map: GanMap }[] = [
  { name: "天乙贵人", map: TIANYI },
  { name: "太极贵人", map: TAIJI },
  { name: "文昌贵人", map: WENCHANG },
  { name: "国印贵人", map: GUOYIN },
  { name: "禄神", map: LUSHEN },
  { name: "羊刃", map: YANGREN },
  { name: "金舆", map: JINYU },
  { name: "红艳煞", map: HONGYAN },
];

/** 三合局:首字(代表) → 局内地支,用于将星/华盖/驿马/桃花等。 */
const SANHE_GROUP: Record<string, Dizhi[]> = {
  申子辰: ["申", "子", "辰"],
  亥卯未: ["亥", "卯", "未"],
  寅午戌: ["寅", "午", "戌"],
  巳酉丑: ["巳", "酉", "丑"],
};
/** 由某地支找其所属三合局 key */
function groupOf(zhi: Dizhi): string | undefined {
  for (const [k, arr] of Object.entries(SANHE_GROUP)) if (arr.includes(zhi)) return k;
  return undefined;
}
/** 三合局 key → 各神煞对应地支 */
const SANHE_SHENSHA: Record<string, Record<string, Dizhi>> = {
  申子辰: { 将星: "子", 华盖: "辰", 驿马: "寅", 桃花: "酉", 劫煞: "巳", 灾煞: "午", 亡神: "亥" },
  亥卯未: { 将星: "卯", 华盖: "未", 驿马: "巳", 桃花: "子", 劫煞: "申", 灾煞: "酉", 亡神: "寅" },
  寅午戌: { 将星: "午", 华盖: "戌", 驿马: "申", 桃花: "卯", 劫煞: "亥", 灾煞: "子", 亡神: "巳" },
  巳酉丑: { 将星: "酉", 华盖: "丑", 驿马: "亥", 桃花: "午", 劫煞: "寅", 灾煞: "卯", 亡神: "申" },
};

/** 年支 → 孤辰、寡宿 */
const GUGUA: Record<string, { 孤辰: Dizhi; 寡宿: Dizhi }> = {
  亥: { 孤辰: "寅", 寡宿: "戌" }, 子: { 孤辰: "寅", 寡宿: "戌" }, 丑: { 孤辰: "寅", 寡宿: "戌" },
  寅: { 孤辰: "巳", 寡宿: "丑" }, 卯: { 孤辰: "巳", 寡宿: "丑" }, 辰: { 孤辰: "巳", 寡宿: "丑" },
  巳: { 孤辰: "申", 寡宿: "辰" }, 午: { 孤辰: "申", 寡宿: "辰" }, 未: { 孤辰: "申", 寡宿: "辰" },
  申: { 孤辰: "亥", 寡宿: "未" }, 酉: { 孤辰: "亥", 寡宿: "未" }, 戌: { 孤辰: "亥", 寡宿: "未" },
};

export interface ShenShaContext {
  dayGan: Tiangan;
  yearZhi: Dizhi;
  dayZhi: Dizhi;
}

/**
 * 求某地支(某一柱)上坐落的神煞。以日干 + 年支/日支(三合)+ 年支(孤寡)为依据。
 * 返回去重后的神煞名数组。
 */
export function shenShaForBranch(ctx: ShenShaContext, zhi: Dizhi): string[] {
  const out = new Set<string>();

  // 日干派
  for (const { name, map } of GAN_SHENSHA) {
    if (map[ctx.dayGan]?.includes(zhi)) out.add(name);
  }

  // 三合派:以年支、日支为基准各取一遍
  for (const base of [ctx.yearZhi, ctx.dayZhi]) {
    const g = groupOf(base);
    if (!g) continue;
    for (const [name, target] of Object.entries(SANHE_SHENSHA[g]!)) {
      if (target === zhi) out.add(name);
    }
  }

  // 孤辰寡宿:以年支为基准
  const gg = GUGUA[ctx.yearZhi];
  if (gg) {
    if (gg.孤辰 === zhi) out.add("孤辰");
    if (gg.寡宿 === zhi) out.add("寡宿");
  }

  return [...out];
}

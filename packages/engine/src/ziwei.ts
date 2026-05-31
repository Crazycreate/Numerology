import { astro } from "iztro";
import { DIZHI } from "@numerology/knowledge";
import type { BirthInput, SanFangSiZheng, ZiweiChart, ZiweiPalace, ZiweiStar } from "./types.js";
import { hourToTimeIndex, validateBirthInput } from "./time.js";
import { resolveBirthDateTime } from "./solartime.js";

/**
 * 计算某宫(以地支定位)的三方四正:本宫 + 对宫(环上 +6)+ 两三合宫(±4)。
 * 纯位置运算,确定性。返回四宫名、四地支与合看的主星集合。
 */
export function computeSanFangSiZheng(
  palaces: ZiweiPalace[],
  branch: string,
): SanFangSiZheng {
  const ring = DIZHI as readonly string[];
  const i = ring.indexOf(branch);
  const byBranch = (b: string) => palaces.find((p) => p.earthlyBranch === b);
  const self = byBranch(branch);
  const opposite = byBranch(ring[(i + 6) % 12]!);
  const trine1 = byBranch(ring[(i + 4) % 12]!); // 三合(顺)
  const trine2 = byBranch(ring[(i + 8) % 12]!); // 三合(逆)

  const order = [self, opposite, trine1, trine2].filter(
    (p): p is ZiweiPalace => Boolean(p),
  );
  const majorStars = Array.from(
    new Set(order.flatMap((p) => p.majorStars.map((s) => s.name))),
  );
  return {
    branches: {
      self: branch,
      opposite: ring[(i + 6) % 12]!,
      trine: [ring[(i + 4) % 12]!, ring[(i + 8) % 12]!],
    },
    palaceNames: {
      self: self?.name ?? "",
      opposite: opposite?.name ?? "",
      trine: [trine1?.name ?? "", trine2?.name ?? ""],
    },
    majorStars,
  };
}

interface RawStar {
  name: string;
  brightness?: string;
  mutagen?: string;
}

/** 排紫微斗数命盘(基于 iztro)。 */
export function castZiwei(input: BirthInput): ZiweiChart {
  validateBirthInput(input);
  const t = resolveBirthDateTime(input);

  const solarDateStr = `${t.year}-${t.month}-${t.day}`;
  const timeIndex = hourToTimeIndex(t.hour);
  const a = astro.bySolar(solarDateStr, timeIndex, input.gender, true, "zh-CN");

  const palaces: ZiweiPalace[] = a.palaces.map((p) => ({
    index: p.index,
    name: p.name,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    isSoulPalace: p.name === "命宫",
    isBodyPalace: p.isBodyPalace,
    majorStars: mapStars(p.majorStars),
    minorStars: mapStars(p.minorStars),
    adjectiveStars: mapStars(p.adjectiveStars),
    decadal: {
      range: [p.decadal.range[0] ?? 0, p.decadal.range[1] ?? 0],
      heavenlyStem: p.decadal.heavenlyStem,
      earthlyBranch: p.decadal.earthlyBranch,
    },
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    jiangqian12: p.jiangqian12,
    suiqian12: p.suiqian12,
    ages: Array.isArray(p.ages) ? [...p.ages] : [],
  }));

  return {
    soulPalaceBranch: a.earthlyBranchOfSoulPalace,
    bodyPalaceBranch: a.earthlyBranchOfBodyPalace,
    fiveElementsClass: a.fiveElementsClass,
    soul: a.soul,
    body: a.body,
    sign: a.sign,
    zodiac: a.zodiac,
    lunarDate: a.lunarDate,
    chineseDate: a.chineseDate,
    palaces,
    soulSanFang: computeSanFangSiZheng(palaces, a.earthlyBranchOfSoulPalace),
  };
}

function mapStars(stars: RawStar[]): ZiweiStar[] {
  return stars.map((s) => ({
    name: s.name,
    brightness: s.brightness || undefined,
    mutagen: s.mutagen || undefined,
  }));
}

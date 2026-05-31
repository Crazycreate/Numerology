import type { Dizhi, Tiangan, TiaohouResult } from "@numerology/knowledge";

export type Gender = "男" | "女";

/** 出生信息(公历)。 */
export interface BirthInput {
  /** 公历年(四位) */
  year: number;
  /** 公历月 1-12 */
  month: number;
  /** 公历日 1-31 */
  day: number;
  /** 24 小时制 0-23 */
  hour: number;
  /** 分钟 0-59,默认 0 */
  minute?: number;
  gender: Gender;
  /**
   * 出生地经度(东经为正,如北京约 116.4)。
   * 预留给真太阳时校正;当前版本【尚未应用】,见 ChartMeta.trueSolarTimeApplied。
   */
  longitude?: number;
}

/** 单柱(年/月/日/时)。 */
export interface Pillar {
  gan: string;
  zhi: string;
  ganZhi: string;
  naYin: string;
  /** 天干十神(日柱为日主本身,留空) */
  shiShenGan: string;
  /** 地支藏干 */
  hideGan: string[];
  /** 地支藏干对应十神 */
  shiShenZhi: string[];
  /** 星运:日主在本柱地支的十二长生 */
  xingYun: string;
  /** 自坐:本柱天干在本柱地支的十二长生 */
  ziZuo: string;
  /** 空亡(旬空)地支,如「寅卯」 */
  xunKong: string;
  /** 本柱地支坐落的神煞 */
  shenSha: string[];
}

export interface DaYunStep {
  ganZhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
}

/** 八字四柱命盘。 */
export interface BaziChart {
  fourPillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  /** 日主(日干) */
  dayMaster: Tiangan;
  /** 月支(用于调候) */
  monthBranch: Dizhi;
  dayWuXing: string;
  /** 调候用神(来自穷通宝鉴知识库,含 reviewed 标记) */
  tiaohou: TiaohouResult;
  startLuck: { description: string; solarDate: string };
  daYun: DaYunStep[];
  lunarDate: string;
}

export interface ZiweiStar {
  name: string;
  brightness?: string;
  /** 四化:禄/权/科/忌,空串表示无 */
  mutagen?: string;
}

export interface ZiweiPalace {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isSoulPalace: boolean;
  isBodyPalace: boolean;
  majorStars: ZiweiStar[];
  minorStars: ZiweiStar[];
  /** 杂曜(龙池凤阁、三台八座、天刑、孤辰寡宿等) */
  adjectiveStars: ZiweiStar[];
  /** 大限范围 [起, 止] 岁 */
  decadal: { range: [number, number]; heavenlyStem: string; earthlyBranch: string };
  /** 长生十二神(长生/沐浴/…) */
  changsheng12: string;
  /** 博士十二神(博士/力士/青龙/…) */
  boshi12: string;
  /** 将前十二神(将星/攀鞍/…) */
  jiangqian12: string;
  /** 岁前十二神(岁建/晦气/…) */
  suiqian12: string;
  /** 小限对应的虚岁列表 */
  ages: number[];
}

/** 三方四正:本宫 + 对宫 + 两三合宫 的合看。 */
export interface SanFangSiZheng {
  branches: { self: string; opposite: string; trine: [string, string] };
  palaceNames: { self: string; opposite: string; trine: [string, string] };
  /** 四宫合看的主星(去重) */
  majorStars: string[];
}

/** 紫微斗数命盘。 */
export interface ZiweiChart {
  /** 命宫地支 */
  soulPalaceBranch: string;
  /** 身宫地支 */
  bodyPalaceBranch: string;
  /** 五行局(如「水二局」) */
  fiveElementsClass: string;
  /** 命主 */
  soul: string;
  /** 身主 */
  body: string;
  sign: string;
  zodiac: string;
  lunarDate: string;
  chineseDate: string;
  palaces: ZiweiPalace[];
  /** 命宫三方四正(判断格局的依据) */
  soulSanFang: SanFangSiZheng;
}

export interface ChartMeta {
  /** 真太阳时是否已校正(提供出生地经度则为 true)。 */
  trueSolarTimeApplied: boolean;
  /** 真太阳时校正详情 */
  correction?: import("./solartime.js").SolarTimeCorrection;
  engine: { iztro: string; lunar: string };
}

/** 一次排盘的完整结果:同一出生信息的八字 + 紫微双盘。 */
export interface ChartResult {
  input: BirthInput;
  meta: ChartMeta;
  bazi: BaziChart;
  ziwei: ZiweiChart;
}

/** 十天干 */
export const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export type Tiangan = (typeof TIANGAN)[number];

/** 十二地支 */
export const DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Dizhi = (typeof DIZHI)[number];

export function isTiangan(x: string): x is Tiangan {
  return (TIANGAN as readonly string[]).includes(x);
}

export function isDizhi(x: string): x is Dizhi {
  return (DIZHI as readonly string[]).includes(x);
}

/** 知识库数据文件通用元信息 */
export interface KnowledgeMeta {
  name: string;
  schema: string;
  source: string;
  version: string;
  /** 是否经人工逐条校对原著。false 时解读层应降权或标注。 */
  reviewed: boolean;
  reviewNote?: string;
  [extra: string]: unknown;
}

/** 穷通宝鉴调候用神表:日干 -> 月支 -> 用神(按重要性排序) */
export interface TiaohouTable {
  meta: KnowledgeMeta;
  data: Record<Tiangan, Record<Dizhi, Tiangan[]>>;
}

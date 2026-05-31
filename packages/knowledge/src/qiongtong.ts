import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  isDizhi,
  isTiangan,
  type Dizhi,
  type Tiangan,
  type TiaohouTable,
} from "./types.js";

/**
 * 调候用神查询结果。
 * - `useGods`: 调候用神,按重要性排序,首位为最急用神。
 * - `reviewed`: 该数据是否经人工校对(来自数据文件 meta)。false 时解读层应标注或降权。
 */
export interface TiaohouResult {
  dayGan: Tiangan;
  monthBranch: Dizhi;
  useGods: Tiangan[];
  reviewed: boolean;
}

/**
 * 在调候表中查询某日干生于某月支的调候用神。纯函数,平台无关。
 * @throws 当日干 / 月支不合法,或表中缺失对应条目时抛错(快速失败,不静默返回空)。
 */
export function lookupTiaohou(
  table: TiaohouTable,
  dayGan: string,
  monthBranch: string,
): TiaohouResult {
  if (!isTiangan(dayGan)) {
    throw new Error(`非法日干: "${dayGan}",应为十天干之一`);
  }
  if (!isDizhi(monthBranch)) {
    throw new Error(`非法月支: "${monthBranch}",应为十二地支之一`);
  }
  const byMonth = table.data[dayGan];
  const useGods = byMonth?.[monthBranch];
  if (!useGods || useGods.length === 0) {
    throw new Error(`调候表缺失条目: ${dayGan}日 生 ${monthBranch}月`);
  }
  return {
    dayGan,
    monthBranch,
    useGods: [...useGods],
    reviewed: table.meta.reviewed,
  };
}

let cached: TiaohouTable | null = null;

/** Node 端加载调候表数据文件(浏览器/小程序应改为打包导入 JSON)。结果缓存。 */
export function loadQiongtongTable(): TiaohouTable {
  if (cached) return cached;
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/qiongtong.js -> ../data/qiongtong.json(package 根下的 data/)
  const dataPath = join(here, "..", "data", "qiongtong.json");
  const raw = readFileSync(dataPath, "utf-8");
  cached = JSON.parse(raw) as TiaohouTable;
  return cached;
}

import {
  isDizhi,
  isTiangan,
  type Dizhi,
  type Tiangan,
  type TiaohouTable,
} from "./types.js";
import QIONGTONG_TABLE from "./qiongtong.data.js";

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

/**
 * 加载调候表。数据已内联为 TS 模块(qiongtong.data.ts)随包打包,
 * 故平台无关——Node、Vercel serverless、浏览器、小程序均可用,无运行时 fs 依赖。
 */
export function loadQiongtongTable(): TiaohouTable {
  return QIONGTONG_TABLE;
}

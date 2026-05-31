import { Solar } from "lunar-javascript";
import {
  isDizhi,
  isTiangan,
  loadQiongtongTable,
  lookupTiaohou,
  type Dizhi,
  type Tiangan,
} from "@numerology/knowledge";
import type { BaziChart, BirthInput, DaYunStep, Pillar } from "./types.js";
import { validateBirthInput } from "./time.js";
import { changSheng } from "./changsheng.js";
import { shenShaForBranch, type ShenShaContext } from "./shensha.js";
import { resolveBirthDateTime } from "./solartime.js";

/** 排八字四柱,并接入穷通宝鉴调候用神。 */
export function castBazi(input: BirthInput): BaziChart {
  validateBirthInput(input);
  const { gender } = input;
  const t = resolveBirthDateTime(input);

  const solar = Solar.fromYmdHms(t.year, t.month, t.day, t.hour, t.minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const dayGan = ec.getDayGan();
  const monthZhi = ec.getMonthZhi();
  const yearZhi = ec.getYearZhi();
  const dayZhi = ec.getDayZhi();
  if (!isTiangan(dayGan)) throw new Error(`排盘异常:日干非天干 "${dayGan}"`);
  if (!isDizhi(monthZhi)) throw new Error(`排盘异常:月支非地支 "${monthZhi}"`);
  if (!isDizhi(yearZhi) || !isDizhi(dayZhi)) throw new Error("排盘异常:年/日支非地支");

  const ctx: ShenShaContext = { dayGan, yearZhi, dayZhi };
  const pillar = (
    gan: string, zhi: string, ganZhi: string, naYin: string,
    shiShenGan: string, hideGan: string[], shiShenZhi: string[], xunKong: string,
  ): Pillar => buildPillar(dayGan, ctx, gan, zhi, ganZhi, naYin, shiShenGan, hideGan, shiShenZhi, xunKong);

  const fourPillars = {
    year: pillar(ec.getYearGan(), ec.getYearZhi(), ec.getYear(), ec.getYearNaYin(),
      ec.getYearShiShenGan(), ec.getYearHideGan(), ec.getYearShiShenZhi(), ec.getYearXunKong()),
    month: pillar(ec.getMonthGan(), ec.getMonthZhi(), ec.getMonth(), ec.getMonthNaYin(),
      ec.getMonthShiShenGan(), ec.getMonthHideGan(), ec.getMonthShiShenZhi(), ec.getMonthXunKong()),
    day: pillar(ec.getDayGan(), ec.getDayZhi(), ec.getDay(), ec.getDayNaYin(),
      "", ec.getDayHideGan(), ec.getDayShiShenZhi(), ec.getDayXunKong()),
    hour: pillar(ec.getTimeGan(), ec.getTimeZhi(), ec.getTime(), ec.getTimeNaYin(),
      ec.getTimeShiShenGan(), ec.getTimeHideGan(), ec.getTimeShiShenZhi(), ec.getTimeXunKong()),
  };

  const tiaohou = lookupTiaohou(loadQiongtongTable(), dayGan, monthZhi);

  const yun = ec.getYun(gender === "男" ? 1 : 0);
  const daYun: DaYunStep[] = yun.getDaYun().map((d) => ({
    ganZhi: d.getGanZhi(),
    startAge: d.getStartAge(),
    endAge: d.getEndAge(),
    startYear: d.getStartYear(),
  }));

  return {
    fourPillars,
    dayMaster: dayGan,
    monthBranch: monthZhi,
    dayWuXing: ec.getDayWuXing(),
    tiaohou,
    startLuck: {
      description: `${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}天后起运`,
      solarDate: yun.getStartSolar().toYmd(),
    },
    daYun,
    lunarDate: lunar.toString(),
  };
}

function buildPillar(
  dayGan: Tiangan,
  ctx: ShenShaContext,
  gan: string,
  zhi: string,
  ganZhi: string,
  naYin: string,
  shiShenGan: string,
  hideGan: string[],
  shiShenZhi: string[],
  xunKong: string,
): Pillar {
  const zhiOk = isDizhi(zhi);
  const ganOk = isTiangan(gan);
  return {
    gan, zhi, ganZhi, naYin, shiShenGan, hideGan, shiShenZhi, xunKong,
    xingYun: zhiOk ? changSheng(dayGan, zhi as Dizhi) : "",
    ziZuo: ganOk && zhiOk ? changSheng(gan as Tiangan, zhi as Dizhi) : "",
    shenSha: zhiOk ? shenShaForBranch(ctx, zhi as Dizhi) : [],
  };
}

import { Lunar } from "lunar-javascript";

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  /** 是否闰月 */
  isLeapMonth?: boolean;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

/**
 * 农历日期 → 阳历日期。闰月以负数月份传给 lunar-javascript。
 * @throws 当农历日期非法(如该年无此闰月)时抛错。
 * @example solarFromLunar({ year: 2000, month: 1, day: 1 }) => { year:2000, month:2, day:5 }
 */
export function solarFromLunar(d: LunarDate): SolarDate {
  if (!Number.isInteger(d.year) || !Number.isInteger(d.month) || !Number.isInteger(d.day)) {
    throw new Error("农历日期必须为整数");
  }
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 30) {
    throw new Error(`农历月日超出范围: ${d.month}月${d.day}日`);
  }
  const month = d.isLeapMonth ? -d.month : d.month;
  let solar;
  try {
    solar = Lunar.fromYmd(d.year, month, d.day).getSolar();
  } catch (e) {
    throw new Error(
      `非法农历日期(${d.year}年${d.isLeapMonth ? "闰" : ""}${d.month}月${d.day}日):该年可能无此闰月或无此日`,
    );
  }
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

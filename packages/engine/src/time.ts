import type { BirthInput } from "./types.js";

/**
 * 公历小时 → iztro 时辰序号(0-12)。
 * 0=早子(00-01)、1=丑(01-03)、…、11=亥(21-23)、12=晚子(23-24)。
 */
export function hourToTimeIndex(hour: number): number {
  if (hour < 0 || hour > 23) {
    throw new Error(`非法小时: ${hour},应为 0-23`);
  }
  if (hour === 23) return 12;
  return Math.floor((hour + 1) / 2);
}

/** 基础输入校验,在系统边界快速失败。 */
export function validateBirthInput(input: BirthInput): void {
  const { year, month, day, hour, minute = 0, gender } = input;
  const fail = (msg: string): never => {
    throw new Error(`非法出生信息: ${msg}`);
  };
  if (!Number.isInteger(year) || year < 1900 || year > 2100) fail(`年 ${year}(支持 1900-2100)`);
  if (!Number.isInteger(month) || month < 1 || month > 12) fail(`月 ${month}`);
  if (!Number.isInteger(day) || day < 1 || day > 31) fail(`日 ${day}`);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) fail(`时 ${hour}`);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) fail(`分 ${minute}`);
  if (gender !== "男" && gender !== "女") fail(`性别 ${gender}(应为 男/女)`);
}

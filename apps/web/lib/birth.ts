import { solarFromLunar, type BirthInput, type HourInferInput } from "@numerology/engine";

/** 若 body 标记为农历,把 year/month/day 转成阳历;否则原样返回。 */
function resolveCalendar(b: Record<string, unknown>, y: number, m: number, d: number) {
  if (b.calendar === "lunar") {
    return solarFromLunar({ year: y, month: m, day: d, isLeapMonth: b.isLeapMonth === true });
  }
  return { year: y, month: m, day: d };
}

/** 把任意外部输入(API body)安全解析为 BirthInput,在边界快速失败。 */
export function parseBirthInput(body: unknown): BirthInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("请求体格式错误");
  }
  const b = body as Record<string, unknown>;
  const num = (key: string): number => {
    const v = Number(b[key]);
    if (!Number.isFinite(v)) throw new Error(`字段 ${key} 非数字`);
    return v;
  };
  const gender = b.gender;
  if (gender !== "男" && gender !== "女") throw new Error("性别必须为 男/女");

  const { year, month, day } = resolveCalendar(b, num("year"), num("month"), num("day"));
  const input: BirthInput = {
    year,
    month,
    day,
    hour: num("hour"),
    minute: b.minute === undefined || b.minute === "" ? 0 : num("minute"),
    gender,
  };
  if (b.longitude !== undefined && b.longitude !== "" && b.longitude !== null) {
    input.longitude = num("longitude");
  }
  return input;
}

/** 时辰推断输入(无时辰):年月日 + 性别(+可选经度)。 */
export function parseHourInferInput(body: unknown): HourInferInput {
  if (typeof body !== "object" || body === null) throw new Error("请求体格式错误");
  const b = body as Record<string, unknown>;
  const num = (key: string): number => {
    const v = Number(b[key]);
    if (!Number.isFinite(v)) throw new Error(`字段 ${key} 非数字`);
    return v;
  };
  if (b.gender !== "男" && b.gender !== "女") throw new Error("性别必须为 男/女");
  const sd = resolveCalendar(b, num("year"), num("month"), num("day"));
  const input: HourInferInput = {
    year: sd.year, month: sd.month, day: sd.day, gender: b.gender,
  };
  if (b.longitude !== undefined && b.longitude !== "" && b.longitude !== null) {
    input.longitude = num("longitude");
  }
  return input;
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { solarFromLunar, castChart } from "../dist/index.js";

test("农历→阳历:2000 正月初一 = 阳历 2000-2-5", () => {
  assert.deepEqual(solarFromLunar({ year: 2000, month: 1, day: 1 }), { year: 2000, month: 2, day: 5 });
});

test("闰月转换:2023 闰二月初一 = 阳历 2023-3-22", () => {
  assert.deepEqual(solarFromLunar({ year: 2023, month: 2, day: 1, isLeapMonth: true }), { year: 2023, month: 3, day: 22 });
});

test("农历转出的阳历排盘 = 直接用阳历排盘(同一天)", () => {
  const s = solarFromLunar({ year: 2000, month: 1, day: 1 }); // → 2000-2-5
  const fromLunar = castChart({ ...s, hour: 9, minute: 30, gender: "男" });
  const fromSolar = castChart({ year: 2000, month: 2, day: 5, hour: 9, minute: 30, gender: "男" });
  assert.equal(fromLunar.bazi.fourPillars.day.ganZhi, fromSolar.bazi.fourPillars.day.ganZhi);
  assert.equal(fromLunar.ziwei.soulPalaceBranch, fromSolar.ziwei.soulPalaceBranch);
});

test("非法农历日期抛错", () => {
  assert.throws(() => solarFromLunar({ year: 2000, month: 13, day: 1 }), /范围/);
});

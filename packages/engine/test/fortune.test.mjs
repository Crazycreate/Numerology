import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFortune } from "../dist/index.js";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" };
const f = analyzeFortune(SAMPLE, { referenceYear: 2026, yearsAhead: 8 });

test("大运:当前运唯一,每步十神有效、引动判定为布尔", () => {
  assert.ok(f.bazi.daYun.length >= 8);
  assert.equal(f.bazi.daYun.filter((d) => d.isCurrent).length, 1, "referenceYear 应恰好落在一步大运");
  for (const d of f.bazi.daYun) {
    assert.ok(d.ganShiShen.length >= 2, "大运天干十神应有效");
    assert.equal(typeof d.suppliesUseGod, "boolean");
  }
});

test("流年:窗口覆盖参考年起 9 年,且唯一标注参考年", () => {
  const years = f.bazi.liuNian.map((y) => y.year);
  assert.ok(years.includes(2026) && years.includes(2034));
  assert.equal(f.bazi.liuNian.filter((y) => y.isReference).length, 1);
  assert.equal(f.bazi.liuNian.find((y) => y.isReference).year, 2026);
});

test("紫微流年四化:2026 有禄权科忌四化,且各落入本命某宫", () => {
  const y = f.ziwei.yearly.find((y) => y.year === 2026);
  assert.ok(y);
  assert.equal(y.sihua.length, 4);
  assert.deepEqual(y.sihua.map((s) => s.type).slice().sort(), ["权", "科", "忌", "禄"].sort());
  for (const s of y.sihua) {
    assert.ok(s.intoPalace && s.intoPalace !== "未入盘", "四化应落在某本命宫");
  }
});

test("大限四化结构完整(禄权科忌各一)", () => {
  assert.deepEqual(f.ziwei.decadal.sihua.map((s) => s.type).slice().sort(), ["权", "科", "忌", "禄"].sort());
});

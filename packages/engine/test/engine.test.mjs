import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, castBazi, castZiwei, hourToTimeIndex } from "../dist/index.js";

const SAMPLE = { year: 1990, month: 5, day: 30, hour: 11, minute: 30, gender: "男" };

test("hourToTimeIndex 边界:早子=0、午=6、亥=11、晚子=12", () => {
  assert.equal(hourToTimeIndex(0), 0);
  assert.equal(hourToTimeIndex(11), 6);
  assert.equal(hourToTimeIndex(22), 11);
  assert.equal(hourToTimeIndex(23), 12);
});

test("八字:四柱齐全,日主为天干,调候用神非空", () => {
  const b = castBazi(SAMPLE);
  for (const k of ["year", "month", "day", "hour"]) {
    assert.ok(b.fourPillars[k].ganZhi.length === 2, `${k}柱干支异常`);
  }
  assert.equal(b.dayMaster, "乙"); // 1990-5-30 11:30 → 日主乙
  assert.equal(b.monthBranch, "巳");
  assert.ok(b.tiaohou.useGods.length > 0);
  assert.ok(b.daYun.length >= 8, "大运步数应充足");
});

test("紫微:12 宫齐全,有且仅一个命宫", () => {
  const z = castZiwei(SAMPLE);
  assert.equal(z.palaces.length, 12);
  const souls = z.palaces.filter((p) => p.isSoulPalace);
  assert.equal(souls.length, 1, "命宫应唯一");
  assert.equal(souls[0].name, "命宫");
  assert.ok(z.fiveElementsClass.length > 0, "五行局缺失");
});

test("castChart:双盘合一,且记录真太阳时未校正", () => {
  const r = castChart(SAMPLE);
  assert.ok(r.bazi && r.ziwei);
  assert.equal(r.meta.trueSolarTimeApplied, false);
  assert.ok(r.meta.engine.iztro && r.meta.engine.lunar);
});

test("确定性:同一输入两次结果完全一致", () => {
  const a = JSON.stringify(castChart(SAMPLE));
  const b = JSON.stringify(castChart(SAMPLE));
  assert.equal(a, b);
});

test("非法输入快速失败", () => {
  assert.throws(() => castChart({ ...SAMPLE, hour: 25 }), /非法/);
  assert.throws(() => castChart({ ...SAMPLE, gender: "x" }), /非法/);
});

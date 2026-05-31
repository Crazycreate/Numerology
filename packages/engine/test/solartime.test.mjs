import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBirthDateTime, favorableDirections, castChart } from "../dist/index.js";

const SAMPLE = { year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" };

test("不提供经度则不校正,时间原样返回", () => {
  const r = resolveBirthDateTime(SAMPLE);
  assert.equal(r.correction.applied, false);
  assert.equal(r.hour, 9);
  assert.equal(r.minute, 30);
});

test("东经偏东(>120)经度差为正,偏西为负", () => {
  // 经度 130(偏东 10°)→ 经度差 (130-120)*4 = +40 分钟
  const east = resolveBirthDateTime({ ...SAMPLE, longitude: 130 });
  assert.equal(east.correction.applied, true);
  assert.equal(east.correction.longitudeMinutes, 40);
  assert.ok(east.correction.offsetMinutes > 0, "偏东应为正偏移");
  // 北京约 116.4°(偏西)→ 经度差为负
  const bj = resolveBirthDateTime({ ...SAMPLE, longitude: 116.4 });
  assert.ok(bj.correction.longitudeMinutes < 0, "偏西经度差应为负");
});

test("校正可能改变时柱(经度足够偏)", () => {
  const noCorr = castChart(SAMPLE);
  const west = castChart({ ...SAMPLE, longitude: 90 }); // 偏西 30° → −120 分钟
  assert.equal(noCorr.meta.trueSolarTimeApplied, false);
  assert.equal(west.meta.trueSolarTimeApplied, true);
  // 09:30 − 120 分 ≈ 07:30,跨过时辰交界,时柱改变
  assert.notEqual(noCorr.bazi.fourPillars.hour.ganZhi, west.bazi.fourPillars.hour.ganZhi);
});

test("用神方位:火→南、木→东", () => {
  const dirs = favorableDirections(["丁", "甲"]);
  assert.equal(dirs.find((d) => d.wuxing === "火").direction, "南方");
  assert.equal(dirs.find((d) => d.wuxing === "木").direction, "东方");
});

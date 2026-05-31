import { test } from "node:test";
import assert from "node:assert/strict";
import { shiShen } from "../dist/shishen.js";

// 交叉验证:日主庚 → 丁=正官、戊=偏印、辛=劫财、庚=比肩(标准十神规则)
test("十神标准规则交叉验证(日主庚)", () => {
  assert.equal(shiShen("庚", "丁"), "正官");
  assert.equal(shiShen("庚", "戊"), "偏印");
  assert.equal(shiShen("庚", "辛"), "劫财");
  assert.equal(shiShen("庚", "庚"), "比肩");
});

test("十神五类两极齐全(以甲为日主)", () => {
  assert.equal(shiShen("甲", "甲"), "比肩"); // 同我同性
  assert.equal(shiShen("甲", "乙"), "劫财"); // 同我异性
  assert.equal(shiShen("甲", "丙"), "食神"); // 我生同性
  assert.equal(shiShen("甲", "丁"), "伤官"); // 我生异性
  assert.equal(shiShen("甲", "戊"), "偏财"); // 我克同性
  assert.equal(shiShen("甲", "己"), "正财"); // 我克异性
  assert.equal(shiShen("甲", "庚"), "七杀"); // 克我同性
  assert.equal(shiShen("甲", "辛"), "正官"); // 克我异性
  assert.equal(shiShen("甲", "壬"), "偏印"); // 生我同性
  assert.equal(shiShen("甲", "癸"), "正印"); // 生我异性
});

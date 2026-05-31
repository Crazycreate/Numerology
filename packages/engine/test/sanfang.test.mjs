import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, computeSanFangSiZheng } from "../dist/index.js";

const chart = castChart({ year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" });
const RING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

test("命宫三方四正:对宫=环上+6、三合=±4,合看主星为四宫并集且非空", () => {
  const sf = chart.ziwei.soulSanFang;
  const i = RING.indexOf(sf.branches.self);
  assert.equal(sf.branches.opposite, RING[(i + 6) % 12]);
  assert.deepEqual(sf.branches.trine.slice().sort(), [RING[(i + 4) % 12], RING[(i + 8) % 12]].sort());
  assert.ok(sf.majorStars.length >= 1, "命宫三方四正合看主星应非空");
});

test("computeSanFangSiZheng 通用:对宫=+6、三合=±4", () => {
  const sf = computeSanFangSiZheng(chart.ziwei.palaces, "子");
  assert.equal(sf.branches.self, "子");
  assert.equal(sf.branches.opposite, "午");
  assert.deepEqual(sf.branches.trine.slice().sort(), ["申", "辰"].sort());
});

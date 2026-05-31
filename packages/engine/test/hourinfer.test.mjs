import { test } from "node:test";
import assert from "node:assert/strict";
import { castHourCandidates } from "../dist/index.js";

const cands = castHourCandidates({ year: 1990, month: 3, day: 18, gender: "男" });

test("生成 12 个时辰候选", () => {
  assert.equal(cands.length, 12);
  assert.deepEqual(cands.map((c) => c.shichen.slice(0, 1)), ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]);
});

test("不同时辰的命宫多数不同(时辰主要改变命宫)", () => {
  const branches = new Set(cands.map((c) => c.soulBranch));
  assert.ok(branches.size >= 10, `命宫地支应高度区分,实际 ${branches.size} 种`);
});

test("每个候选含八字时柱与命宫主星等区分特征", () => {
  for (const c of cands) {
    assert.equal(c.baziHour.ganZhi.length, 2);
    assert.equal(c.soulBranch.length, 1);
    assert.ok(c.fiveElementsClass.length > 0);
    assert.ok(Array.isArray(c.sanFangStars));
  }
});

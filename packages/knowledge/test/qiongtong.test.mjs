import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadQiongtongTable,
  lookupTiaohou,
  TIANGAN,
  DIZHI,
} from "../dist/index.js";

test("调候表覆盖全部 10 天干 × 12 月支 = 120 格,且用神非空", () => {
  const table = loadQiongtongTable();
  let count = 0;
  for (const gan of TIANGAN) {
    for (const zhi of DIZHI) {
      const r = lookupTiaohou(table, gan, zhi);
      assert.ok(r.useGods.length > 0, `${gan}日${zhi}月 用神为空`);
      for (const g of r.useGods) {
        assert.ok(TIANGAN.includes(g), `${gan}日${zhi}月 出现非天干用神: ${g}`);
      }
      count++;
    }
  }
  assert.equal(count, 120);
});

test("已知条目:甲木生寅月,调候用神为丙、癸", () => {
  const table = loadQiongtongTable();
  const r = lookupTiaohou(table, "甲", "寅");
  assert.deepEqual(r.useGods, ["丙", "癸"]);
});

test("数据已逐格对照徐乐吾《穷通宝鉴》提要校订,reviewed 应为 true", () => {
  const table = loadQiongtongTable();
  const r = lookupTiaohou(table, "丙", "午");
  assert.equal(r.reviewed, true);
});

test("校订后的格:内容修正与丁火首位次序", () => {
  const table = loadQiongtongTable();
  // A 内容修正
  assert.deepEqual(lookupTiaohou(table, "甲", "丑").useGods, ["丁", "庚", "丙"]);
  assert.deepEqual(lookupTiaohou(table, "乙", "戌").useGods, ["癸", "辛"]);
  // B 丁火首位用神(甲/壬引丁为最急)
  assert.deepEqual(lookupTiaohou(table, "丁", "寅").useGods, ["甲", "庚"]);
  assert.deepEqual(lookupTiaohou(table, "丁", "午").useGods, ["壬", "庚", "癸"]);
  assert.deepEqual(lookupTiaohou(table, "丁", "申").useGods, ["甲", "庚", "丙", "戊"]);
});

test("非法日干快速失败,不静默返回", () => {
  const table = loadQiongtongTable();
  assert.throws(() => lookupTiaohou(table, "X", "寅"), /非法日干/);
  assert.throws(() => lookupTiaohou(table, "甲", "Z"), /非法月支/);
});

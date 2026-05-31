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

test("首版数据未经人工校对,reviewed 应为 false", () => {
  const table = loadQiongtongTable();
  const r = lookupTiaohou(table, "丙", "午");
  assert.equal(r.reviewed, false);
});

test("非法日干快速失败,不静默返回", () => {
  const table = loadQiongtongTable();
  assert.throws(() => lookupTiaohou(table, "X", "寅"), /非法日干/);
  assert.throws(() => lookupTiaohou(table, "甲", "Z"), /非法月支/);
});

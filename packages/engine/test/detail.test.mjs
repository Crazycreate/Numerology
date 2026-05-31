import { test } from "node:test";
import assert from "node:assert/strict";
import { changSheng, shenShaForBranch, castBazi, CHANGSHENG_STAGES } from "../dist/index.js";

test("十二长生计算正确(规则交叉验证)", () => {
  assert.equal(changSheng("庚", "戌"), "衰"); // 庚长生巳,顺行至戌=衰
  assert.equal(changSheng("丁", "丑"), "墓"); // 丁长生酉,逆行至丑=墓
  assert.equal(changSheng("甲", "亥"), "长生"); // 甲阳长生在亥
  assert.equal(changSheng("乙", "午"), "长生"); // 乙阴长生在午
});

test("神煞标准规则:天乙/驿马/将星/桃花/华盖", () => {
  // 日干庚 → 天乙贵人在丑、未
  assert.ok(shenShaForBranch({ dayGan: "庚", yearZhi: "丑", dayZhi: "戌" }, "丑").includes("天乙贵人"));
  // 年支申(申子辰局)→ 驿马在寅、将星在子、桃花在酉、华盖在辰
  const ctx = { dayGan: "庚", yearZhi: "申", dayZhi: "子" };
  assert.ok(shenShaForBranch(ctx, "寅").includes("驿马"));
  assert.ok(shenShaForBranch(ctx, "子").includes("将星"));
  assert.ok(shenShaForBranch(ctx, "酉").includes("桃花"));
  assert.ok(shenShaForBranch(ctx, "辰").includes("华盖"));
});

test("castBazi 填充星运/自坐/空亡/神煞(结构有效)", () => {
  const b = castBazi({ year: 1990, month: 3, day: 18, hour: 9, minute: 30, gender: "男" });
  const day = b.fourPillars.day;
  assert.ok(CHANGSHENG_STAGES.includes(day.xingYun), "星运应为十二长生之一");
  assert.ok(CHANGSHENG_STAGES.includes(day.ziZuo), "自坐应为十二长生之一");
  assert.equal(day.xunKong.length, 2, "空亡应为两字");
  for (const p of [b.fourPillars.year, b.fourPillars.month, b.fourPillars.day, b.fourPillars.hour]) {
    assert.ok(Array.isArray(p.shenSha));
  }
});

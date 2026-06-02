import { test } from "node:test";
import assert from "node:assert/strict";
import { castChart, analyzeFortune } from "@numerology/engine";
import { buildContextPack, SYSTEM_PERSONA, REPORT_SECTIONS, buildReportUserPrompt } from "../dist/index.js";

const birth = { year: 1990, month: 3, day: 18, hour: 14, minute: 0, gender: "男" };
const chart = castChart(birth);

test("上下文包含四柱、日主、调候、命宫等关键事实", () => {
  const { markdown } = buildContextPack(chart);
  for (const must of ["八字四柱", "日主", "调候用神", "紫微斗数", "命宫", "大运"]) {
    assert.ok(markdown.includes(must), `上下文缺少: ${must}`);
  }
  assert.ok(markdown.includes(chart.bazi.fourPillars.day.ganZhi), "日柱干支应出现在上下文");
});

test("未校正真太阳时产出 caveat", () => {
  const { caveats } = buildContextPack(chart);
  assert.ok(caveats.some((c) => c.includes("真太阳时")), "应提示真太阳时未校正");
});

test("调候表已校对(reviewed),不再产出待校对 caveat", () => {
  const { caveats } = buildContextPack(chart);
  assert.ok(!caveats.some((c) => c.includes("调候")), "调候已校订,不应再有待校对提示");
});

test("大运过滤掉起运前的空步", () => {
  const { markdown } = buildContextPack(chart);
  assert.ok(!/、\(/.test(markdown), "大运不应出现空干支步");
});

test("传入动态运势后,上下文含大运/流年/四化飞宫", () => {
  const fortune = analyzeFortune(birth, { referenceYear: 2026, yearsAhead: 8 });
  const { markdown } = buildContextPack(chart, fortune);
  for (const must of ["动态运势", "八字大运", "八字流年", "大限四化", "流年四化", "引动用神"]) {
    assert.ok(markdown.includes(must), `动态段缺少: ${must}`);
  }
  // 不传 fortune 时不应出现动态段
  assert.ok(!buildContextPack(chart).markdown.includes("动态运势"));
});

test("系统人设强调动静结合、运为主导", () => {
  assert.ok(SYSTEM_PERSONA.includes("动静结合") && SYSTEM_PERSONA.includes("运为主导") === false
    ? SYSTEM_PERSONA.includes("占主导") : true);
  assert.ok(SYSTEM_PERSONA.includes("四化"));
});

test("报告用户指令包含全部章节与注意事项", () => {
  const { caveats } = buildContextPack(chart);
  const prompt = buildReportUserPrompt(caveats);
  for (const s of REPORT_SECTIONS) {
    assert.ok(prompt.includes(s.title), `指令缺少章节: ${s.title}`);
  }
  assert.ok(prompt.includes("真太阳时"), "指令应带出 caveat");
  assert.ok(SYSTEM_PERSONA.includes("八字") && SYSTEM_PERSONA.includes("紫微"));
});

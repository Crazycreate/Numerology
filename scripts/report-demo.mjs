/**
 * 端到端 demo:出生信息 → 排双盘 → AI 解读报告。
 *
 * 用法:
 *   1. 在项目根建 .env:选 provider(默认免费 glm),填对应 key
 *      例:AI_PROVIDER=glm 然后 GLM_API_KEY=...(见 .env.example)
 *   2. node scripts/report-demo.mjs [YYYY M D H m 男|女]
 *      例:node scripts/report-demo.mjs 1990 6 15 14 0 男
 *
 * 不带参数则用内置样例。无 key 时只排盘、不出报告。
 */
import { readFileSync } from "node:fs";
import { castChart, analyzeFortune } from "@numerology/engine";
import { buildContextPack, generateReport, providerSummary } from "@numerology/ai";

// —— 极简 .env 加载(无第三方依赖)——
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* .env 不存在则跳过 */
}

const a = process.argv.slice(2);
const input = a.length >= 6
  ? { year: +a[0], month: +a[1], day: +a[2], hour: +a[3], minute: +a[4], gender: a[5] }
  : { year: 1990, month: 6, day: 15, hour: 14, minute: 0, gender: "男" };

console.log("出生信息:", input);
const chart = castChart(input);
const fortune = analyzeFortune(input, { yearsAhead: 8 });
const { markdown, caveats } = buildContextPack(chart, fortune);

console.log("\n========== 命盘事实(上下文包)==========\n");
console.log(markdown);
if (caveats.length) console.log("注意事项:\n- " + caveats.join("\n- "));

console.log(`\n========== AI 解读报告(${providerSummary()} 生成中…)==========\n`);
const t0 = Date.now();
try {
  const { markdown: report, usage } = await generateReport(chart, { fortune });
  console.log(report);
  console.log(
    `\n[用时 ${((Date.now() - t0) / 1000).toFixed(1)}s | 输入 ${usage.inputTokens} / 输出 ${usage.outputTokens} tokens` +
      ` | 缓存写 ${usage.cacheCreationTokens} 读 ${usage.cacheReadTokens}]`,
  );
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API key|AI_PROVIDER|AI_BASE_URL|AI_MODEL/.test(msg)) {
    console.log(`\n[跳过 AI 报告] ${msg}`);
    console.log("配置好 provider 和 key(见 .env.example)后重跑即可。");
    process.exit(0);
  }
  throw err;
}

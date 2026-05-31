import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { buildContextPack } from "./context.js";
import { buildReportUserPrompt, buildFortuneReportPrompt } from "./prompts.js";
import { MAX_TOKENS, MODELS, buildCachedSystem, extractText, getClient, toUsage, type Usage } from "./client.js";

export interface ReportResult {
  markdown: string;
  usage: Usage;
}

export interface ReportOptions {
  /** 动态运势分析(强烈建议传入,报告才能做动静结合) */
  fortune?: FortuneAnalysis;
  maxTokens?: number;
}

/** 生成命盘解读报告(非流式)。需要 ANTHROPIC_API_KEY。 */
export async function generateReport(
  chart: ChartResult,
  opts: ReportOptions = {},
): Promise<ReportResult> {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const res = await getClient().messages.create({
    model: MODELS.report,
    max_tokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildReportUserPrompt(caveats) }],
  });
  return { markdown: extractText(res.content), usage: toUsage(res.usage) };
}

/** 生成报告(流式),返回 SDK MessageStream,供 Web 端逐字渲染。 */
export function streamReport(chart: ChartResult, opts: ReportOptions = {}) {
  const { caveats } = buildContextPack(chart, opts.fortune);
  return getClient().messages.stream({
    model: MODELS.report,
    max_tokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildReportUserPrompt(caveats) }],
  });
}

/** 《大运流年深析》(非流式):八字 × 紫微合参,逐步逐年。需要 ANTHROPIC_API_KEY。 */
export async function generateFortuneReport(
  chart: ChartResult,
  opts: ReportOptions = {},
): Promise<ReportResult> {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const res = await getClient().messages.create({
    model: MODELS.report,
    max_tokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildFortuneReportPrompt(caveats) }],
  });
  return { markdown: extractText(res.content), usage: toUsage(res.usage) };
}

/** 《大运流年深析》(流式)。 */
export function streamFortuneReport(chart: ChartResult, opts: ReportOptions = {}) {
  const { caveats } = buildContextPack(chart, opts.fortune);
  return getClient().messages.stream({
    model: MODELS.report,
    max_tokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildFortuneReportPrompt(caveats) }],
  });
}

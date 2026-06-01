import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { buildContextPack } from "./context.js";
import { buildReportUserPrompt, buildFortuneReportPrompt } from "./prompts.js";
import {
  MAX_TOKENS,
  buildCachedSystem,
  chatComplete,
  chatStream,
  type Usage,
  type ProviderOptions,
} from "./client.js";

export interface ReportResult {
  markdown: string;
  usage: Usage;
}

export interface ReportOptions {
  /** 动态运势分析(强烈建议传入,报告才能做动静结合) */
  fortune?: FortuneAnalysis;
  maxTokens?: number;
  /** BYOK:用户自带 provider/key */
  ai?: ProviderOptions;
}

/** 生成命盘解读报告(非流式)。需要当前 provider 的 API key。 */
export async function generateReport(
  chart: ChartResult,
  opts: ReportOptions = {},
): Promise<ReportResult> {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const { text, usage } = await chatComplete({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildReportUserPrompt(caveats) }],
  }, opts.ai);
  return { markdown: text, usage };
}

/** 生成报告(流式),返回文本事件流,供 Web 端逐字渲染。 */
export function streamReport(chart: ChartResult, opts: ReportOptions = {}) {
  const { caveats } = buildContextPack(chart, opts.fortune);
  return chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildReportUserPrompt(caveats) }],
  }, opts.ai);
}

/** 《大运流年深析》(非流式):八字 × 紫微合参,逐步逐年。 */
export async function generateFortuneReport(
  chart: ChartResult,
  opts: ReportOptions = {},
): Promise<ReportResult> {
  const { caveats } = buildContextPack(chart, opts.fortune);
  const { text, usage } = await chatComplete({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildFortuneReportPrompt(caveats) }],
  }, opts.ai);
  return { markdown: text, usage };
}

/** 《大运流年深析》(流式)。 */
export function streamFortuneReport(chart: ChartResult, opts: ReportOptions = {}) {
  const { caveats } = buildContextPack(chart, opts.fortune);
  return chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.report,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildFortuneReportPrompt(caveats) }],
  }, opts.ai);
}

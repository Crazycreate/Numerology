import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { buildContextPack } from "./context.js";
import {
  buildReportUserPrompt,
  buildFortuneReportPrompt,
  buildReportSectionPrompt,
  buildFortuneSectionPrompt,
  REPORT_SEGMENTS,
  FORTUNE_SEGMENTS,
  type ReportLens,
} from "./prompts.js";
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
  /** 解读视角:纯八字 / 纯紫微 / 合参(默认合参)。仅分段流式接口生效。 */
  lens?: ReportLens;
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

/**
 * 每节输出上限,设约 1800 token —— 纯"安全网",须明显高于实际自然篇幅。
 * 控篇幅靠 prompt 硬性字数(~900–1100 字);实测最慢的 Opus 即便如此仍会写到 ~1300–1400 字,
 * 故上限留到 1800,使其自然篇幅(~1400 字)在撞顶前就以句号收尾,不被 max_tokens 切半句;
 * 而 ~1400 字在 Opus ~32 字/秒下约 ~48s,仍稳在 Vercel 60s 内。上限须高于自然篇幅,切勿压到其下。
 */
const SECTION_MAX_TOKENS = 1800;

/** 《命盘格局解读》——单节流式(分段模式)。sectionKey ∈ REPORT_SEGMENTS[].key。 */
export function streamReportSection(chart: ChartResult, sectionKey: string, opts: ReportOptions = {}) {
  const seg = REPORT_SEGMENTS.find((s) => s.key === sectionKey);
  if (!seg) throw new Error(`未知报告章节:${sectionKey}`);
  const { caveats } = buildContextPack(chart, opts.fortune);
  return chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? SECTION_MAX_TOKENS,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildReportSectionPrompt(caveats, seg, opts.lens ?? "both") }],
  }, opts.ai);
}

/** 《大运流年深析》——单节流式(分段模式)。sectionKey ∈ FORTUNE_SEGMENTS[].key。 */
export function streamFortuneSection(chart: ChartResult, sectionKey: string, opts: ReportOptions = {}) {
  const seg = FORTUNE_SEGMENTS.find((s) => s.key === sectionKey);
  if (!seg) throw new Error(`未知大运流年章节:${sectionKey}`);
  const { caveats } = buildContextPack(chart, opts.fortune);
  return chatStream({
    kind: "report",
    maxTokens: opts.maxTokens ?? SECTION_MAX_TOKENS,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [{ role: "user", content: buildFortuneSectionPrompt(caveats, seg, opts.lens ?? "both") }],
  }, opts.ai);
}

import Anthropic from "@anthropic-ai/sdk";
import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { buildContextPack } from "./context.js";
import { SYSTEM_PERSONA } from "./prompts.js";

/** 模型选择:报告用最强推理(Opus),对话用更快的 Sonnet。 */
export const MODELS = {
  report: "claude-opus-4-8",
  chat: "claude-sonnet-4-6",
} as const;

/**
 * 输出上限默认值——以"详实为准、永不截断"为原则给足空间(并非强制写满,
 * 只是移除天花板;实际篇幅由 prompt 与内容决定)。长报告配合下方加长超时。
 */
export const MAX_TOKENS = {
  report: 16000,
  chat: 8000,
} as const;

let client: Anthropic | null = null;

/** 懒加载 Anthropic 客户端。缺 key 时给出明确错误,不静默失败。 */
export function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 ANTHROPIC_API_KEY 环境变量。请在 .env 中配置后再调用解读层。");
  }
  // 加长超时:详实报告可能输出上万 token,非流式请求需更长等待窗口。
  client = new Anthropic({ apiKey, timeout: 15 * 60 * 1000, maxRetries: 2 });
  return client;
}

/**
 * "人设 + 命盘事实"组装成稳定 system 块并打 cache_control。
 * 报告与对话共用 → prompt caching 命中,追问几乎不重复计费,也保证两者基于同一命盘事实。
 */
export function buildCachedSystem(
  chart: ChartResult,
  fortune?: FortuneAnalysis,
): Anthropic.TextBlockParam[] {
  const { markdown } = buildContextPack(chart, fortune);
  return [
    { type: "text", text: SYSTEM_PERSONA },
    { type: "text", text: markdown, cache_control: { type: "ephemeral" } },
  ];
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export function toUsage(u: Anthropic.Usage): Usage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheCreationTokens: u.cache_creation_input_tokens ?? 0,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
  };
}

export function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

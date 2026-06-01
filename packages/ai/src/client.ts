import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { buildContextPack } from "./context.js";
import { SYSTEM_PERSONA } from "./prompts.js";
import type { SystemBlock } from "./provider.js";

// 统一解读层入口(多 provider:GLM/Gemini/Groq/Anthropic/custom),从 provider 透出。
export {
  chatComplete,
  chatStream,
  activeProviderName,
  providerSummary,
  type Usage,
  type TextStream,
  type SystemBlock,
  type ChatMessage,
  type ModelKind,
  type ProviderOptions,
} from "./provider.js";

/**
 * 输出上限默认值——以"详实为准、永不截断"为原则给足空间(并非强制写满,
 * 只是移除天花板;实际篇幅由 prompt 与内容决定)。长报告配合加长超时。
 */
export const MAX_TOKENS = {
  report: 16000,
  chat: 8000,
} as const;

/**
 * "人设 + 命盘事实"组装成 system 块,第二块标记 cache(仅 Anthropic 生效)。
 * 报告与对话共用 → 保证两者基于同一命盘事实;在 Anthropic 上还命中 prompt caching。
 */
export function buildCachedSystem(chart: ChartResult, fortune?: FortuneAnalysis): SystemBlock[] {
  const { markdown } = buildContextPack(chart, fortune);
  return [
    { text: SYSTEM_PERSONA },
    { text: markdown, cache: true },
  ];
}

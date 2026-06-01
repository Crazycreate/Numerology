import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import { MAX_TOKENS, buildCachedSystem, chatComplete, chatStream, type Usage } from "./client.js";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatAnswer {
  text: string;
  usage: Usage;
}

export interface ChatOptions {
  /** 动态运势分析(与报告传同一份,保证口径一致) */
  fortune?: FortuneAnalysis;
  maxTokens?: number;
}

/**
 * 就命盘进行对话追问("我适合创业吗""和父母怎么相处")。
 * 复用与报告相同的命盘 system 块(含动态运势),确保回答与报告基于同一命盘事实。
 */
export async function answerFollowUp(
  chart: ChartResult,
  history: ChatTurn[],
  question: string,
  opts: ChatOptions = {},
): Promise<ChatAnswer> {
  const { text, usage } = await chatComplete({
    kind: "chat",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.chat,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [...history, { role: "user", content: question }],
  });
  return { text, usage };
}

/** 对话追问(流式),供 Web 端逐字渲染。 */
export function streamFollowUp(
  chart: ChartResult,
  history: ChatTurn[],
  question: string,
  opts: ChatOptions = {},
) {
  return chatStream({
    kind: "chat",
    maxTokens: opts.maxTokens ?? MAX_TOKENS.chat,
    system: buildCachedSystem(chart, opts.fortune),
    messages: [...history, { role: "user", content: question }],
  });
}

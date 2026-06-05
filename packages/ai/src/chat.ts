import type { ChartResult, FortuneAnalysis } from "@numerology/engine";
import {
  buildCachedSystem,
  chatComplete,
  chatStream,
  type Usage,
  type ProviderOptions,
} from "./client.js";

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
  /** BYOK:用户自带 provider/key */
  ai?: ProviderOptions;
}

/**
 * 单次追问回答上限。设 1800 token —— 纯安全网。
 * 自由问答无法像报告那样预切维度,故靠下方【作答规矩】的硬性字数让模型在篇幅内自然收尾,
 * 即便最慢的 Opus 也能 <60s 答完,绕开 Vercel maxDuration=60 对长回答的截断。
 */
const CHAT_MAX_TOKENS = 1800;

/** 对话作答规矩:就事论事、白话、硬性篇幅自然收尾——避免长答被 Vercel 60s 截断。 */
const CHAT_DIRECTIVE = `【对话作答规矩】
- 直接回答用户这一个问题,**不要重述整张命盘**,就事论事、有针对性。
- 【说人话】用大白话讲清楚,术语(十神、四化、调候、三方四正等)第一次出现就在括号里当场翻成人话,不堆砌行话,让完全不懂命理的人也看得懂。
- 【篇幅·硬性】把这个问题答透即可,约 700–1100 字;**务必在篇幅内把话说完、自然收尾(以句号结束),宁可少写一点,也绝不写到一半被切断。** 还想深入,就请用户接着追问。
- 严格区分"命盘能给的领域与吉凶倾向(可肯定)"和"具体事件(不可编造)";涉及年份按"倾向应期、可能±1 年"对待。`;

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
    maxTokens: opts.maxTokens ?? CHAT_MAX_TOKENS,
    system: [...buildCachedSystem(chart, opts.fortune), { text: CHAT_DIRECTIVE }],
    messages: [...history, { role: "user", content: question }],
  }, opts.ai);
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
    maxTokens: opts.maxTokens ?? CHAT_MAX_TOKENS,
    system: [...buildCachedSystem(chart, opts.fortune), { text: CHAT_DIRECTIVE }],
    messages: [...history, { role: "user", content: question }],
  }, opts.ai);
}

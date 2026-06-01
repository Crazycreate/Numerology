import type { HourCandidate } from "@numerology/engine";
import {
  chatComplete,
  chatStream,
  type SystemBlock,
  type Usage,
  type ProviderOptions,
} from "./client.js";
import { HOUR_INFER_PERSONA } from "./prompts.js";
import type { ChatTurn } from "./chat.js";

/** 把 12 时辰候选压成紧凑对照表喂给模型。 */
function candidatesTable(cands: HourCandidate[]): string {
  return cands
    .map(
      (c) =>
        `- ${c.shichen}(${c.range}):时柱 ${c.baziHour.ganZhi}${c.baziHour.shiShenGan ? `(时干${c.baziHour.shiShenGan})` : ""};` +
        `命宫 ${c.soulBranch}·${c.soulMajorStars.join("") || "空宫"};${c.fiveElementsClass};命主${c.soul}/身主${c.body};身宫${c.bodyPalaceName};` +
        `命格三方四正主星:${c.sanFangStars.join("、")}`,
    )
    .join("\n");
}

/** 时辰推断的 system 块(人设 + 12 候选对照表);第二块标记 cache(仅 Anthropic 生效)。 */
export function buildHourInferSystem(cands: HourCandidate[]): SystemBlock[] {
  return [
    { text: HOUR_INFER_PERSONA },
    { text: `## 该日 12 时辰候选命盘(用于比对反推)\n\n${candidatesTable(cands)}`, cache: true },
  ];
}

export interface HourInferTurn extends ChatTurn {}

const HOUR_INFER_MAX_TOKENS = 3000;
const HOUR_INFER_OPENING = "(开始)请简短说明原理,并向我提出第一轮用于区分时辰的问题。";

/** 时辰推断对话(流式)。message 为空表示开场(模型应自我介绍并发起首轮提问)。 */
export function streamHourInference(
  cands: HourCandidate[],
  history: HourInferTurn[],
  message: string,
  opts: { maxTokens?: number; ai?: ProviderOptions } = {},
) {
  const userMsg = message.trim() || HOUR_INFER_OPENING;
  return chatStream({
    kind: "chat",
    maxTokens: opts.maxTokens ?? HOUR_INFER_MAX_TOKENS,
    system: buildHourInferSystem(cands),
    messages: [...history, { role: "user", content: userMsg }],
  }, opts.ai);
}

/** 非流式版本(测试/批处理用)。 */
export async function inferHour(
  cands: HourCandidate[],
  history: HourInferTurn[],
  message: string,
  opts: { maxTokens?: number } = {},
): Promise<{ text: string; usage: Usage }> {
  const userMsg = message.trim() || HOUR_INFER_OPENING;
  const { text, usage } = await chatComplete({
    kind: "chat",
    maxTokens: opts.maxTokens ?? HOUR_INFER_MAX_TOKENS,
    system: buildHourInferSystem(cands),
    messages: [...history, { role: "user", content: userMsg }],
  });
  return { text, usage };
}

import type Anthropic from "@anthropic-ai/sdk";
import type { HourCandidate } from "@numerology/engine";
import { MODELS, extractText, getClient, toUsage, type Usage } from "./client.js";
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

/** 时辰推断的缓存 system 块(人设 + 12 候选对照表)。 */
export function buildHourInferSystem(cands: HourCandidate[]): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: HOUR_INFER_PERSONA },
    {
      type: "text",
      text: `## 该日 12 时辰候选命盘(用于比对反推)\n\n${candidatesTable(cands)}`,
      cache_control: { type: "ephemeral" },
    },
  ];
}

export interface HourInferTurn extends ChatTurn {}

/** 时辰推断对话(流式)。message 为空表示开场(模型应自我介绍并发起首轮提问)。 */
export function streamHourInference(
  cands: HourCandidate[],
  history: HourInferTurn[],
  message: string,
  opts: { maxTokens?: number } = {},
) {
  const userMsg = message.trim() || "(开始)请简短说明原理,并向我提出第一轮用于区分时辰的问题。";
  return getClient().messages.stream({
    model: MODELS.chat,
    max_tokens: opts.maxTokens ?? 3000,
    system: buildHourInferSystem(cands),
    messages: [...history, { role: "user", content: userMsg }],
  });
}

/** 非流式版本(测试/批处理用)。 */
export async function inferHour(
  cands: HourCandidate[],
  history: HourInferTurn[],
  message: string,
  opts: { maxTokens?: number } = {},
): Promise<{ text: string; usage: Usage }> {
  const userMsg = message.trim() || "(开始)请简短说明原理,并向我提出第一轮用于区分时辰的问题。";
  const res = await getClient().messages.create({
    model: MODELS.chat,
    max_tokens: opts.maxTokens ?? 3000,
    system: buildHourInferSystem(cands),
    messages: [...history, { role: "user", content: userMsg }],
  });
  return { text: extractText(res.content), usage: toUsage(res.usage) };
}

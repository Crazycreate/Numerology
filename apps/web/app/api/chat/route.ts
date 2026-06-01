import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFollowUp, type ChatTurn } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToResponse } from "@/lib/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 流式对话追问(复用同一命盘 + 动态运势的缓存上下文)。 */
export async function POST(req: Request): Promise<Response> {
  try {
    ensureEnv();
    const body = (await req.json()) as {
      input?: unknown;
      history?: ChatTurn[];
      question?: unknown;
    };
    const input = parseBirthInput(body.input);
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) throw new Error("追问内容不能为空");
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    return streamToResponse(streamFollowUp(chart, history, question, { fortune }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "对话失败";
    return Response.json({ error: message }, { status: 400 });
  }
}

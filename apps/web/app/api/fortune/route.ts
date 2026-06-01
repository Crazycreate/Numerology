import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFortuneReport } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToResponse } from "@/lib/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 流式生成《大运流年深析》(八字 × 紫微合参,逐步逐年)。 */
export async function POST(req: Request): Promise<Response> {
  try {
    ensureEnv();
    const body = (await req.json()) as { input?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    return streamToResponse(streamFortuneReport(chart, { fortune }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "大运流年深析生成失败";
    return Response.json({ error: message }, { status: 400 });
  }
}

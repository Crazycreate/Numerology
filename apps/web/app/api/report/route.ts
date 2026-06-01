import { castChart, analyzeFortune } from "@numerology/engine";
import { streamReport } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToResponse } from "@/lib/stream";
import { parseAi } from "@/lib/aiOpts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 流式生成命盘解读报告(动静结合)。 */
export async function POST(req: Request): Promise<Response> {
  try {
    ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    return streamToResponse(streamReport(chart, { fortune, ai: parseAi(body) }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "报告生成失败";
    return Response.json({ error: message }, { status: 400 });
  }
}

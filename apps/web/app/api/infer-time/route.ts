import { castHourCandidates } from "@numerology/engine";
import { streamHourInference, type ChatTurn } from "@numerology/ai";
import { parseHourInferInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToResponse } from "@/lib/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** 流式时辰推断对话:据已知人生事实比对 12 时辰命盘,反推最可能时辰。 */
export async function POST(req: Request): Promise<Response> {
  try {
    ensureEnv();
    const body = (await req.json()) as { input?: unknown; history?: ChatTurn[]; message?: unknown };
    const input = parseHourInferInput(body.input);
    const message = typeof body.message === "string" ? body.message : "";
    const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
    const candidates = castHourCandidates(input);
    return streamToResponse(streamHourInference(candidates, history, message));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "时辰推断失败";
    return Response.json({ error: msg }, { status: 400 });
  }
}
